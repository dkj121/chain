import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIComponentSearch } from '../src/aiComponentSearch';

describe('AIComponentSearch', () => {
    let search: AIComponentSearch;

    beforeEach(() => {
        search = new AIComponentSearch();
        search.setLocalComponents([
            {
                id: 'bootstrap-card',
                name: 'Card',
                category: 'bootstrap',
                template: '<div class="card"><div class="card-body">Content</div></div>',
                icon: '🃏'
            },
            {
                id: 'html-button',
                name: 'Button',
                category: 'html',
                template: '<button>Click me</button>',
                icon: '🔘'
            },
            {
                id: 'razor-foreach',
                name: 'Foreach Loop',
                category: 'razor',
                template: '@foreach (var item in Model.Items) { }',
                icon: '🔁'
            }
        ]);
    });

    describe('Local Keyword Search (no API)', () => {
        it('should find exact match with high relevance', async () => {
            const results = await search.search('card');

            expect(results.length).toBeGreaterThan(0);
            const cardResult = results.find(r => r.name === 'Card');
            expect(cardResult).toBeDefined();
            expect(cardResult!.relevance).toBeGreaterThanOrEqual(0.7);
        });

        it('should find partial match', async () => {
            const results = await search.search('but');

            const buttonResult = results.find(r => r.name === 'Button');
            expect(buttonResult).toBeDefined();
        });

        it('should return empty array for no matches', async () => {
            const results = await search.search('nonexistent');

            expect(results).toEqual([]);
        });

        it('should be case-insensitive', async () => {
            const results = await search.search('CARD');

            expect(results.length).toBeGreaterThan(0);
            expect(results.find(r => r.name === 'Card')).toBeDefined();
        });

        it('should filter by minimum relevance', async () => {
            const results = await search.search('c', { minRelevance: 0.8 });

            // Should only return high-relevance matches
            results.forEach(r => {
                expect(r.relevance).toBeGreaterThanOrEqual(0.8);
            });
        });

        it('should limit results count', async () => {
            const results = await search.search('o', { maxResults: 2 });

            expect(results.length).toBeLessThanOrEqual(2);
        });

        it('should sort results by relevance descending', async () => {
            const results = await search.search('o');

            for (let i = 1; i < results.length; i++) {
                expect(results[i - 1].relevance).toBeGreaterThanOrEqual(results[i].relevance);
            }
        });
    });

    describe('Caching', () => {
        it('should cache search results', async () => {
            const query = 'card';

            // First search
            const results1 = await search.search(query);

            // Second search should return cached results
            const results2 = await search.search(query);

            expect(results2).toEqual(results1);
        });

        it('should respect cache timeout', async () => {
            search.setCacheTimeout(100); // 100ms timeout

            const query = 'card';
            await search.search(query);

            // Wait for cache to expire
            await new Promise(resolve => setTimeout(resolve, 150));

            // Should perform new search (we can't directly test this, but no error should occur)
            const results = await search.search(query);
            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe('API Integration', () => {
        it('should fall back to local search when API key not set', async () => {
            // No API key set
            const results = await search.search('card');

            expect(results.length).toBeGreaterThan(0);
            expect(results.find(r => r.name === 'Card')).toBeDefined();
        });

        it('should fall back to local search on API error', async () => {
            search.setApiKey('test-key');

            // Mock fetch to simulate API failure
            global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

            const results = await search.search('card');

            // Should still get results from local search
            expect(results.length).toBeGreaterThan(0);
            expect(search.getLastError()).toBeDefined();
        });

        it('should handle API response correctly', async () => {
            search.setApiKey('test-key');

            // Mock successful API response
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    content: [{
                        text: JSON.stringify([
                            {
                                name: 'Product Card',
                                description: 'A card for displaying products',
                                template: '<div class="product-card">...</div>',
                                relevance: 0.95
                            }
                        ])
                    }]
                })
            } as Response);

            const results = await search.search('product card');

            expect(results.length).toBeGreaterThan(0);
            expect(results[0].name).toBe('Product Card');
            expect(results[0].relevance).toBe(0.95);
        });

        it('should handle malformed API response gracefully', async () => {
            search.setApiKey('test-key');

            // Mock API response with invalid JSON
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    content: [{
                        text: 'Not valid JSON'
                    }]
                })
            } as Response);

            const results = await search.search('card');

            // Should fall back to local search
            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe('Performance', () => {
        it('should return results within 2 seconds', async () => {
            const startTime = Date.now();
            await search.search('card');
            const endTime = Date.now();

            const duration = endTime - startTime;
            expect(duration).toBeLessThan(2000);
        });
    });
});
