/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { VSBuffer, bufferToReadable, readableToBuffer, bufferToStream, streamToBuffer, writeableBufferStream } from 'vs/base/common/buffer';
import { timeout } from 'vs/base/common/async';

suite('Buffer', () => {

	test('issue #71993 - VSBuffer#toString returns numbers', () => {
		const data = new Uint8Array([1, 2, 3, 'h'.charCodeAt(0), 'i'.charCodeAt(0), 4, 5]).buffer;
		const buffer = VSBuffer.wrap(new Uint8Array(data, 3, 2));
		assert.deepEqual(buffer.toString(), 'hi');
	});

	test('bufferToReadable / readableToBuffer', () => {
		const content = 'Hello World';
		const readable = bufferToReadable(VSBuffer.fromString(content));

		assert.equal(readableToBuffer(readable).toString(), content);
	});

	test('bufferToStream / streamToBuffer', async () => {
		const content = 'Hello World';
		const stream = bufferToStream(VSBuffer.fromString(content));

		assert.equal((await streamToBuffer(stream)).toString(), content);
	});

	test('bufferWriteableStream - basics (no error)', async () => {
		const stream = writeableBufferStream();

		let chunks: VSBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		let errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		await timeout(0);
		stream.write(VSBuffer.fromString('Hello'));
		await timeout(0);
		stream.end(VSBuffer.fromString('World'));

		assert.equal(chunks.length, 2);
		assert.equal(chunks[0].toString(), 'Hello');
		assert.equal(chunks[1].toString(), 'World');
		assert.equal(ended, true);
		assert.equal(errors.length, 0);
	});

	test('bufferWriteableStream - basics (error)', async () => {
		const stream = writeableBufferStream();

		let chunks: VSBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		let errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		await timeout(0);
		stream.write(VSBuffer.fromString('Hello'));
		await timeout(0);
		stream.end(new Error());

		assert.equal(chunks.length, 1);
		assert.equal(chunks[0].toString(), 'Hello');
		assert.equal(ended, true);
		assert.equal(errors.length, 1);
	});

	test('bufferWriteableStream - buffers data when no listener', async () => {
		const stream = writeableBufferStream();

		await timeout(0);
		stream.write(VSBuffer.fromString('Hello'));
		await timeout(0);
		stream.end(VSBuffer.fromString('World'));

		let chunks: VSBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		let errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		assert.equal(chunks.length, 1);
		assert.equal(chunks[0].toString(), 'HelloWorld');
		assert.equal(ended, true);
		assert.equal(errors.length, 0);
	});

	test('bufferWriteableStream - buffers errors when no listener', async () => {
		const stream = writeableBufferStream();

		await timeout(0);
		stream.write(VSBuffer.fromString('Hello'));
		await timeout(0);
		stream.error(new Error());

		let chunks: VSBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		stream.end();

		assert.equal(chunks.length, 1);
		assert.equal(chunks[0].toString(), 'Hello');
		assert.equal(ended, true);
		assert.equal(errors.length, 1);
	});

	test('bufferWriteableStream - buffers end when no listener', async () => {
		const stream = writeableBufferStream();

		await timeout(0);
		stream.write(VSBuffer.fromString('Hello'));
		await timeout(0);
		stream.end(VSBuffer.fromString('World'));

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		let chunks: VSBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		assert.equal(chunks.length, 1);
		assert.equal(chunks[0].toString(), 'HelloWorld');
		assert.equal(ended, true);
		assert.equal(errors.length, 0);
	});

	test('bufferWriteableStream - nothing happens after end()', async () => {
		const stream = writeableBufferStream();

		let chunks: VSBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		await timeout(0);
		stream.write(VSBuffer.fromString('Hello'));
		await timeout(0);
		stream.end(VSBuffer.fromString('World'));

		let dataCalledAfterEnd = false;
		stream.on('data', data => {
			dataCalledAfterEnd = true;
		});

		let errorCalledAfterEnd = false;
		stream.on('error', error => {
			errorCalledAfterEnd = true;
		});

		let endCalledAfterEnd = false;
		stream.on('end', () => {
			endCalledAfterEnd = true;
		});

		await timeout(0);
		stream.write(VSBuffer.fromString('Hello'));
		await timeout(0);
		stream.error(new Error());
		await timeout(0);
		stream.end(VSBuffer.fromString('World'));

		assert.equal(dataCalledAfterEnd, false);
		assert.equal(errorCalledAfterEnd, false);
		assert.equal(endCalledAfterEnd, false);

		assert.equal(chunks.length, 2);
		assert.equal(chunks[0].toString(), 'Hello');
		assert.equal(chunks[1].toString(), 'World');
	});
});
