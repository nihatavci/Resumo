// src/components/workspace/chat-message-parser.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMessageSegments,
  parseMatchLines,
  extractMemoryPoints,
} from './chat-message-parser';

describe('parseMessageSegments — memory fence', () => {
  it('extracts :::memory block as memory segment', () => {
    const input = 'Some text\n:::memory\nEmphasise HubSpot CRM\nFlag German gap\n:::\nTail text';
    const segs = parseMessageSegments(input);
    assert.equal(segs.length, 3);
    assert.equal(segs[0].type, 'text');
    assert.equal(segs[1].type, 'memory');
    assert.deepEqual((segs[1] as { type: 'memory'; points: string[] }).points, [
      'Emphasise HubSpot CRM',
      'Flag German gap',
    ]);
    assert.equal(segs[2].type, 'text');
  });
});

describe('parseMessageSegments — match fence', () => {
  it('extracts :::match block as match segment', () => {
    const input = ':::match\n✅ Google Ads | Used at FACTUREE\n❌ German | Gap\n:::';
    const segs = parseMessageSegments(input);
    assert.equal(segs.length, 1);
    assert.equal(segs[0].type, 'match');
  });
});

describe('parseMatchLines', () => {
  it('parses valid match lines', () => {
    const lines = parseMatchLines('✅ Google Ads | Used at FACTUREE\n⚡ Full-funnel | Partial\n❌ German | Gap\ngarbage line');
    assert.equal(lines.length, 3);
    assert.equal(lines[0].marker, '✅');
    assert.equal(lines[0].requirement, 'Google Ads');
    assert.equal(lines[0].explanation, 'Used at FACTUREE');
    assert.equal(lines[1].marker, '⚡');
    assert.equal(lines[2].marker, '❌');
  });
});

describe('extractMemoryPoints', () => {
  it('deduplicates points case-insensitively', () => {
    const existing = ['Emphasise HubSpot CRM'];
    const incoming = ['emphasise hubspot crm', 'Flag German gap'];
    const result = extractMemoryPoints(existing, incoming);
    assert.deepEqual(result, ['Emphasise HubSpot CRM', 'Flag German gap']);
  });
});
