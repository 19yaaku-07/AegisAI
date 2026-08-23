"""Smoke test for analysis module — run from backend/ directory."""
from analysis import analyse_text, _extract_json, _validate_and_normalise

# Test 1: empty text fast-path (no IBM API call)
result = analyse_text('')
print('Empty text result:')
print('  risk_level:', result['risk_level'])
print('  category:', result['threat_category'])
print('  recs count:', len(result['recommendations']))
assert result['risk_level'] == 'safe'
assert len(result['recommendations']) == 3
print('PASS: empty-text fast-path')

# Test 2: JSON extraction from markdown-fenced response
raw = (
    'Sure! Here is the JSON:\n'
    '```json\n'
    '{"risk_level":"high","threat_category":"Phishing",'
    '"explanation":"Suspicious link present.","recommendations":["Do not click.","Report it.","Delete the message."]}\n'
    '```'
)
parsed = _extract_json(raw)
print('Parsed risk_level from fenced markdown:', parsed['risk_level'])
assert parsed['risk_level'] == 'high'
print('PASS: JSON extraction from markdown fences')

# Test 3: invalid risk_level defaults to medium
bad = {
    'risk_level': 'EXTREME',
    'threat_category': 'Unknown',
    'explanation': 'Test.',
    'recommendations': ['a', 'b', 'c'],
}
validated = _validate_and_normalise(bad)
print('Invalid risk_level corrected to:', validated['risk_level'])
assert validated['risk_level'] == 'medium'
print('PASS: invalid risk_level normalisation')

# Test 4: missing recommendations get padded to 3
sparse = {
    'risk_level': 'low',
    'threat_category': 'Spam',
    'explanation': 'Minor issue.',
    'recommendations': [],
}
validated2 = _validate_and_normalise(sparse)
assert len(validated2['recommendations']) == 3
print('PASS: empty recommendations padded to 3')

print('\nAll analysis unit tests passed.')
