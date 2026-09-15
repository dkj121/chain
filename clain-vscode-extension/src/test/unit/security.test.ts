import * as assert from 'assert';
import * as vscode from 'vscode';
import { PropertiesPanel } from '../../propertiesPanel';

suite('Security Tests - XSS Prevention', () => {
    let provider: PropertiesPanel;

    setup(() => {
        provider = new PropertiesPanel();
    });

    test('Should escape double quotes in CSS values', () => {
        const maliciousValue = 'red" onload="alert(1)';
        const lineText = '<div class="test">Content</div>';

        const result = (provider as any).injectStyleAttribute(lineText, 'color', maliciousValue);

        assert.ok(result.includes('&quot;'), 'Double quote should be escaped');
        assert.ok(!result.includes('onload="alert'), 'Script should not be executable');
        assert.ok(result.includes('style="color: red&quot; onload=&quot;alert(1)"'), 'Full escape should be present');
    });

    test('Should escape ampersands in CSS values', () => {
        const valueWithAmpersand = 'url(data:image/svg+xml;charset=utf-8,%3Csvg&fill=%23fff%3E)';
        const lineText = '<div>Content</div>';

        const result = (provider as any).injectStyleAttribute(lineText, 'background', valueWithAmpersand);

        assert.ok(result.includes('&amp;'), 'Ampersands should be escaped');
    });

    test('Should escape less-than and greater-than in CSS values', () => {
        const maliciousValue = '<script>alert(1)</script>';
        const lineText = '<div>Content</div>';

        const result = (provider as any).injectStyleAttribute(lineText, 'content', maliciousValue);

        assert.ok(result.includes('&lt;'), 'Less-than should be escaped');
        assert.ok(result.includes('&gt;'), 'Greater-than should be escaped');
        assert.ok(!result.includes('<script>'), 'Script tag should not be present');
    });

    test('Should escape values in existing style attributes', () => {
        const lineText = '<div style="color: blue">Content</div>';
        const maliciousValue = 'red" onload="alert(1)';

        const result = (provider as any).injectStyleAttribute(lineText, 'color', maliciousValue);

        assert.ok(result.includes('&quot;'), 'Double quote should be escaped');
        assert.ok(!result.includes('onload="alert'), 'Script should not be executable');
    });

    test('Should handle multiple style properties with escaping', () => {
        const lineText = '<div style="color: blue; font-size: 14px">Content</div>';
        const maliciousValue = 'red" onclick="alert(1)';

        const result = (provider as any).injectStyleAttribute(lineText, 'color', maliciousValue);

        assert.ok(result.includes('font-size'), 'Existing property should be preserved');
        assert.ok(result.includes('&quot;'), 'Double quote should be escaped');
        assert.ok(!result.includes('onclick="alert'), 'Event handler should not be executable');
    });

    test('Should escape all HTML entities in escapeHtmlAttribute helper', () => {
        const testCases = [
            { input: 'normal text', expected: 'normal text' },
            { input: '"quotes"', expected: '&quot;quotes&quot;' },
            { input: 'a&b', expected: 'a&amp;b' },
            { input: '<script>', expected: '&lt;script&gt;' },
            { input: '"><script>alert(1)</script><div class="', expected: '&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;&lt;div class=&quot;' },
        ];

        for (const { input, expected } of testCases) {
            const result = (provider as any).escapeHtmlAttribute(input);
            assert.strictEqual(result, expected, `Failed to escape: ${input}`);
        }
    });

    test('Should not double-escape already safe values', () => {
        const safeValue = 'red';
        const lineText = '<div>Content</div>';

        const result = (provider as any).injectStyleAttribute(lineText, 'color', safeValue);

        assert.ok(result.includes('style="color: red"'), 'Safe value should remain unescaped');
        assert.ok(!result.includes('&'), 'No escape sequences for safe value');
    });

    test('Should prevent attribute breakout via style value', () => {
        const lineText = '<div class="container">Content</div>';
        const attackVector = 'red" class="malicious" data-evil="true';

        const result = (provider as any).injectStyleAttribute(lineText, 'color', attackVector);

        assert.ok(result.includes('&quot;'), 'Quotes should be escaped');
        assert.ok(!result.match(/class="malicious"/), 'Malicious class should not be injected');

        const classMatches = result.match(/class="/g);
        assert.strictEqual(classMatches?.length, 1, 'Should only have original class attribute');
    });
});
