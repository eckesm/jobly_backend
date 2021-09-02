'use strict';

const request = require('supertest');

const db = require('../db');
const app = require('../app');

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	a1Token
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe('POST /jobs', function() {
	const newJob = {
		title         : 'new',
		salary        : 1000,
		equity        : 0,
		companyHandle : 'c1'
	};

	test('ok for admins', async function() {
		const resp = await request(app).post('/jobs').send(newJob).set('authorization', `Bearer ${a1Token}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			job : {
				id     : expect.any(Number),
				...newJob,
				equity : '0'
			}
		});
	});

	test('fails for users not admins', async function() {
		const resp = await request(app).post('/jobs').send(newJob).set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('bad request with missing data', async function() {
		const resp = await request(app)
			.post('/jobs')
			.send({
				title : 'new'
			})
			.set('authorization', `Bearer ${a1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test('bad request with invalid data', async function() {
		const resp = await request(app)
			.post('/jobs')
			.send({
				...newJob,
				companyHandle : 'not-a-comp-too-long'
			})
			.set('authorization', `Bearer ${a1Token}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** GET /jobs */

describe('GET /jobs', function() {
	test('ok for anon', async function() {
		const resp = await request(app).get('/jobs');
		expect(resp.body).toEqual({
			jobs : [
				{
					id            : expect.any(Number),
					title         : 'j1',
					salary        : 1,
					equity        : '0',
					companyHandle : 'c1'
				},
				{
					id            : expect.any(Number),
					title         : 'j2',
					salary        : 2,
					equity        : '0',
					companyHandle : 'c2'
				},
				{
					id            : expect.any(Number),
					title         : 'j3',
					salary        : 3,
					equity        : '0.1',
					companyHandle : 'c3'
				}
			]
		});
	});

	test('filtered title', async function() {
		const resp = await request(app).get('/jobs?title=j');
		expect(resp.body).toEqual({
			jobs : [
				{
					id            : expect.any(Number),
					title         : 'j1',
					salary        : 1,
					equity        : '0',
					companyHandle : 'c1'
				},
				{
					id            : expect.any(Number),
					title         : 'j2',
					salary        : 2,
					equity        : '0',
					companyHandle : 'c2'
				},
				{
					id            : expect.any(Number),
					title         : 'j3',
					salary        : 3,
					equity        : '0.1',
					companyHandle : 'c3'
				}
			]
		});
	});

	test('filtered minSalary', async function() {
		const resp = await request(app).get('/jobs?minSalary=2');
		expect(resp.body).toEqual({
			jobs : [
				{
					id            : expect.any(Number),
					title         : 'j2',
					salary        : 2,
					equity        : '0',
					companyHandle : 'c2'
				},
				{
					id            : expect.any(Number),
					title         : 'j3',
					salary        : 3,
					equity        : '0.1',
					companyHandle : 'c3'
				}
			]
		});
	});

	test('filtered hasEquity', async function() {
		const resp = await request(app).get('/jobs?hasEquity=true');
		expect(resp.body).toEqual({
			jobs : [
				{
					id            : expect.any(Number),
					title         : 'j3',
					salary        : 3,
					equity        : '0.1',
					companyHandle : 'c3'
				}
			]
		});
	});

	test('fails: test next() handler', async function() {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query('DROP TABLE jobs CASCADE');
		const resp = await request(app).get('/jobs').set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(500);
	});
});

/************************************** GET /jobs/:id */

describe('GET /jobs/:id', function() {
	test('works for anon', async function() {
		const jobs = await request(app).get(`/jobs`);
		const resp = await request(app).get(`/jobs/${jobs.body.jobs[0].id}`);
		expect(resp.body).toEqual({
			job : {
				id            : jobs.body.jobs[0].id,
				title         : 'j1',
				salary        : 1,
				equity        : '0',
				companyHandle : 'c1'
			}
		});
	});

	test('not found for no such job', async function() {
		const resp = await request(app).get(`/jobs/0`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** PATCH /jobs/:id */

describe('PATCH /jobs/:id', function() {
	test('works for admins', async function() {
		const jobs = await request(app).get(`/jobs`);
		const resp = await request(app)
			.patch(`/jobs/${jobs.body.jobs[0].id}`)
			.send({
				title : 'j1-new'
			})
			.set('authorization', `Bearer ${a1Token}`);
		expect(resp.body).toEqual({
			job : {
				id            : jobs.body.jobs[0].id,
				title         : 'j1-new',
				salary        : 1,
				equity        : '0',
				companyhandle : 'c1'
			}
		});
	});

	test('fails for users not admins', async function() {
		const jobs = await request(app).get(`/jobs`);
		const resp = await request(app)
			.patch(`/jobs/${jobs.body.jobs[0].id}`)
			.send({
				title : 'j1-new'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('unauth for anon', async function() {
		const jobs = await request(app).get(`/jobs`);
		const resp = await request(app).patch(`/jobs/${jobs.body.jobs[0].id}`).send({
			name : 'j1-new'
		});
		expect(resp.statusCode).toEqual(401);
	});

	test('not found on no such job', async function() {
		const resp = await request(app)
			.patch(`/jobs/0`)
			.send({
				title : 'new nope'
			})
			.set('authorization', `Bearer ${a1Token}`);
		expect(resp.statusCode).toEqual(404);
	});

	test('bad request on handle change attempt', async function() {
		const jobs = await request(app).get(`/jobs`);
		const resp = await request(app)
			.patch(`/jobs/${jobs.body.jobs[0].id}`)
			.send({
				companyHandle : 'c2'
			})
			.set('authorization', `Bearer ${a1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test('bad request on invalid data', async function() {
		const jobs = await request(app).get(`/jobs`);
		const resp = await request(app)
			.patch(`/jobs/${jobs.body.jobs[0].id}`)
			.send({
				salary : false
			})
			.set('authorization', `Bearer ${a1Token}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** DELETE /jobs/:handle */

describe('DELETE /jobs/:id', function() {
	test('works for admins', async function() {
		const jobs = await request(app).get(`/jobs`);
		const resp = await request(app)
			.delete(`/jobs/${jobs.body.jobs[0].id}`)
			.set('authorization', `Bearer ${a1Token}`);
		expect(resp.body).toEqual({ deleted: `${jobs.body.jobs[0].id}` });
	});

	test('fails for users not admins', async function() {
		const jobs = await request(app).get(`/jobs`);
		const resp = await request(app)
			.delete(`/jobs/${jobs.body.jobs[0].id}`)
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('unauth for anon', async function() {
		const jobs = await request(app).get(`/jobs`);
		const resp = await request(app).delete(`/jobs/${jobs.body.jobs[0].id}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('not found for no such company', async function() {
		const resp = await request(app).delete(`/jobs/0`).set('authorization', `Bearer ${a1Token}`);
		expect(resp.statusCode).toEqual(404);
	});
});
