'use strict'

const test = require('tape')
const { fork } = require('child_process')
const { join } = require('path')
const { once } = require('events')
const { promisify } = require('util')

const immediate = promisify(setImmediate)

async function all (stream) {
  stream.setEncoding('utf8')
  let data = ''
  for await (let chunk of stream) {
    data += chunk
  }
  return data
}

test('close gracefully', async (t) => {
  const child = fork(join(__dirname, 'simple.js'), {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
  })

  // one line to kickstart the test
  await once(child.stderr, 'readable')
  t.pass('readable emitted')

  const out = all(child.stdout)
  out.catch(() => {})

  child.kill('SIGTERM')

  const [code, signal] = await once(child, 'close')
  t.is(code, 1)
  t.is(signal, null)
  t.is(await out, 'SIGTERM\n')
})