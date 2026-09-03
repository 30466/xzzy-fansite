import test from 'node:test'
import assert from 'node:assert/strict'
import { formatBeijingDateTime, getAbsoluteTime, getArchiveDate, getArchiveDateFromBeijingDateTime, parseBeijingDateTime, unixMsFromBeijingDateTime } from '../src/utils/time.js'

test('北京时间 13:56 归档到当天', () => {
  const value = Date.parse('2026-08-28T05:56:00Z')
  assert.equal(formatBeijingDateTime(value), '2026-08-28 13:56:00')
  assert.equal(getArchiveDate(value), '2026-08-28')
})
test('北京时间 06:00 是归档边界', () => {
  assert.equal(getArchiveDate(Date.parse('2026-08-27T21:59:59Z')), '2026-08-27')
  assert.equal(getArchiveDate(Date.parse('2026-08-27T22:00:00Z')), '2026-08-28')
})
test('文件名北京时间正确跨年', () => {
  assert.equal(getArchiveDateFromBeijingDateTime('2026-01-01 05:59:59'), '2025-12-31')
  assert.equal(getArchiveDateFromBeijingDateTime('2026-01-01~06.00.00'), '2026-01-01')
})
test('北京时间文字统一转换成绝对 Unix 毫秒', () => {
  assert.equal(unixMsFromBeijingDateTime('2026-08-28 13:56:00'), Date.parse('2026-08-28T05:56:00Z'))
})
test('UTC ISO 显式显示为北京时间', () => {
  assert.equal(formatBeijingDateTime('2026-09-01T10:03:15.000Z', { seconds: false }), '2026-09-01 18:03')
  assert.equal(getAbsoluteTime('2026-09-01T10:03:15.000Z'), Date.parse('2026-09-01T10:03:15.000Z'))
})
test('无效时间不会生成日期分组', () => {
  assert.equal(getArchiveDate('invalid'), null)
  assert.equal(getArchiveDate('2026-08-28 13:56:00'), null)
  assert.equal(getAbsoluteTime('2026-08-28 13:56:00'), 0)
  assert.equal(getArchiveDateFromBeijingDateTime('2026-02-30 05:00:00'), null)
  assert.equal(parseBeijingDateTime(''), null)
})
