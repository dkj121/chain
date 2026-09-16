export interface SearchResult {
    name: string;
    description: string;
    template: string;
    relevance: number;
    id?: string;
    category?: string;
    icon?: string;
}

export interface SearchOptions {
    minRelevance?: number;
    maxResults?: number;
}

interface LocalComponent {
    id: string;
    name: string;
    template: string;
    category: string;
    icon: string;
}

interface CacheEntry {
    results: SearchResult[];
    timestamp: number;
}

/**
 * AIComponentSearch provides AI-powered component search functionality.
 * Falls back to local keyword search when API is unavailable.
 */
export class AIComponentSearch {
    private apiKey: string | null = null;
    private apiEndpoint: string = 'https://api.anthropic.com/v1/messages';
    private localComponents: LocalComponent[] = [];
    private cache: Map<string, CacheEntry> = new Map();
    private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes default
    private lastError: Error | null = null;

    /**
     * Search for components using natural language query
     */
    async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        const minRelevance = options.minRelevance ?? 0.5;
        const maxResults = options.maxResults ?? 10;

        // Check cache first
        const cached = this.getFromCache(query);
        if (cached) {
            return this.filterResults(cached, minRelevance, maxResults);
        }

        // Try AI search first
        if (this.apiKey) {
            try {
                const results = await this.searchWithAI(query);
                this.addToCache(query, results);
                return this.filterResults(results, minRelevance, maxResults);
            } catch (error) {
                this.lastError = error as Error;
                // Fall through to local search
            }
        }

        // Fallback to local keyword search
        const results = this.searchLocally(query);
        return this.filterResults(results, minRelevance, maxResults);
    }

    /**
     * Set API key for Claude API access
     */
    setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
    }

    /**
     * Set local components for fallback search
     */
    setLocalComponents(components: LocalComponent[]): void {
        this.localComponents = components;
    }

    /**
     * Set cache timeout in milliseconds
     */
    setCacheTimeout(timeout: number): void {
        this.cacheTimeout = timeout;
    }

    /**
     * Get last error from failed API call
     */
    getLastError(): Error | null {
        return this.lastError;
    }

    /**
     * Search using Claude API
     */
    private async searchWithAI(query: string): Promise<SearchResult[]> {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey!,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: this.buildSearchPrompt(query)
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return this.parseAIResponse(data);
    }

    /**
     * Build prompt for AI search
     */
    private buildSearchPrompt(query: string): string {
        const componentList = this.localComponents.map(c =>
            `- ${c.name} (${c.category}): ${c.template.substring(0, 50)}...`
        ).join('\n');

        return `Given this user query: "${query}"

Available components:
${componentList}

Return a JSON array of matching components with relevance scores (0-1).
Format: [{"name": "ComponentName", "description": "Brief description", "template": "HTML template", "relevance": 0.95}]

Return only the JSON array, no additional text.`;
    }

    /**
     * Parse AI response to extract search results
     */
    private parseAIResponse(data: any): SearchResult[] {
        try {
            // Extract content from Claude API response
            const content = data.content?.[0]?.text || '';

            // Try to extract JSON array from response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                return [];
            }

            const results = JSON.parse(jsonMatch[0]);
            return results.map((r: any) => ({
                name: r.name,
                description: r.description || '',
                template: r.template || '',
                relevance: r.relevance || 0.5
            }));
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return [];
        }
    }

    /**
     * Search locally using keyword matching
     */
    private searchLocally(query: string): SearchResult[] {
        const lowerQuery = query.toLowerCase();

        return this.localComponents
            .filter(c => c.name.toLowerCase().includes(lowerQuery))
            .map(c => ({
                name: c.name,
                description: `${c.category} component`,
                template: c.template,
                relevance: this.calculateLocalRelevance(c, lowerQuery),
                id: c.id,
                category: c.category,
                icon: c.icon
            }));
    }

    /**
     * Calculate relevance score for local search
     */
    private calculateLocalRelevance(component: LocalComponent, query: string): number {
        const name = component.name.toLowerCase();

        // Exact match
        if (name === query) {
            return 1.0;
        }

        // Starts with query
        if (name.startsWith(query)) {
            return 0.9;
        }

        // Contains query
        if (name.includes(query)) {
            return 0.7;
        }

        return 0.5;
    }

    /**
     * Filter results by relevance and max count
     */
    private filterResults(results: SearchResult[], minRelevance: number, maxResults: number): SearchResult[] {
        return results
            .filter(r => r.relevance >= minRelevance)
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, maxResults);
    }

    /**
     * Get results from cache if still valid
     */
    private getFromCache(query: string): SearchResult[] | null {
        const entry = this.cache.get(query);
        if (!entry) {
            return null;
        }

        const now = Date.now();
        if (now - entry.timestamp > this.cacheTimeout) {
            this.cache.delete(query);
            return null;
        }

        return entry.results;
    }

    /**
     * Add results to cache
     */
    private addToCache(query: string, results: SearchResult[]): void {
        this.cache.set(query, {
            results,
            timestamp: Date.now()
        });
    }
}
