import { describe, it, beforeEach, afterEach } from 'mocha';
import * as assert from 'assert';
import * as sinon from 'sinon';
import { AIComponentSearch } from '../../aiComponentSearch';

describe('AIComponentSearch', () => {
    let aiSearch: AIComponentSearch;
    let fetchStub: sinon.SinonStub;

    beforeEach(() => {
        aiSearch = new AIComponentSearch();
        // Stub global fetch for API calls
        fetchStub = sinon.stub(global, 'fetch' as any);
    });

    afterEach(() => {
        fetchStub.restore();
    });

    describe('Search API Integration', () => {
        it('Should search components using natural language query', async () => {
            const mockApiResponse = {
                content: [{
                    text: JSON.stringify([
                        {
                            name: 'UserCard',
                            description: 'Displays user information with avatar',
                            template: '<div class="user-card">...</div>',
                            relevance: 0.95
                        }
                    ])
                }]
            };

            fetchStub.resolves({
                ok: true,
                json: async () => mockApiResponse
            });

            aiSearch.setApiKey('test-key');
            const results = await aiSearch.search('show user profile card');

            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].name, 'UserCard');
            assert.ok(results[0].relevance > 0.9);
        });

        it('Should handle API errors gracefully', async () => {
            fetchStub.rejects(new Error('Network error'));

            aiSearch.setApiKey('test-key');
            const results = await aiSearch.search('user card');

            assert.strictEqual(results.length, 0);
            assert.ok(aiSearch.getLastError());
        });

        it('Should filter results by relevance threshold', async () => {
            const mockApiResponse = {
                content: [{
                    text: JSON.stringify([
                        { name: 'HighRelevance', relevance: 0.9, template: '<div>high</div>', description: 'High' },
                        { name: 'LowRelevance', relevance: 0.3, template: '<div>low</div>', description: 'Low' }
                    ])
                }]
            };

            fetchStub.resolves({
                ok: true,
                json: async () => mockApiResponse
            });

            aiSearch.setApiKey('test-key');
            const results = await aiSearch.search('component', { minRelevance: 0.7 });

            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].name, 'HighRelevance');
        });

        it('Should use API key from configuration', async () => {
            const apiKey = 'test-api-key';
            aiSearch.setApiKey(apiKey);

            fetchStub.resolves({
                ok: true,
                json: async () => ({ content: [{ text: '[]' }] })
            });

            await aiSearch.search('test query');

            assert.ok(fetchStub.called);
            const callArgs = fetchStub.firstCall.args;
            const headers = callArgs[1].headers;
            assert.ok(headers['x-api-key'] === apiKey || headers['Authorization']?.includes(apiKey));
        });
    });

    describe('Local Fallback', () => {
        it('Should fall back to keyword search when API unavailable', async () => {
            fetchStub.rejects(new Error('API unavailable'));

            const localComponents = [
                { id: 'btn-1', name: 'Button', template: '<button>Click</button>', category: 'html', icon: '🔘' },
                { id: 'card-1', name: 'Card', template: '<div class="card">...</div>', category: 'bootstrap', icon: '🃏' }
            ];

            aiSearch.setApiKey('test-key');
            aiSearch.setLocalComponents(localComponents);
            const results = await aiSearch.search('button');

            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].name, 'Button');
        });

        it('Should perform case-insensitive keyword matching', async () => {
            fetchStub.rejects(new Error('API unavailable'));

            const localComponents = [
                { id: 'input-1', name: 'TextInput', template: '<input />', category: 'html', icon: '📝' }
            ];

            aiSearch.setLocalComponents(localComponents);
            const results = await aiSearch.search('TEXTINPUT');

            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].name, 'TextInput');
        });
    });

    describe('Caching', () => {
        it('Should cache search results for same query', async () => {
            const mockApiResponse = {
                content: [{
                    text: JSON.stringify([
                        { name: 'CachedComponent', relevance: 0.9, template: '<div>cached</div>', description: 'Cached' }
                    ])
                }]
            };

            fetchStub.resolves({
                ok: true,
                json: async () => mockApiResponse
            });

            aiSearch.setApiKey('test-key');
            await aiSearch.search('test query');
            await aiSearch.search('test query');

            // API should only be called once due to caching
            assert.strictEqual(fetchStub.callCount, 1);
        });

        it('Should invalidate cache after timeout', async () => {
            const mockApiResponse = {
                content: [{
                    text: JSON.stringify([
                        { name: 'Component', relevance: 0.9, template: '<div>test</div>', description: 'Test' }
                    ])
                }]
            };

            fetchStub.resolves({
                ok: true,
                json: async () => mockApiResponse
            });

            // Set short cache timeout
            aiSearch.setApiKey('test-key');
            aiSearch.setCacheTimeout(100); // 100ms

            await aiSearch.search('test');

            // Wait for cache to expire
            await new Promise(resolve => setTimeout(resolve, 150));

            await aiSearch.search('test');

            assert.strictEqual(fetchStub.callCount, 2);
        });
    });
});
