'use strict';

const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const Job = require('./job.js');
const { update } = require('./user.js');
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe('create', function() {
	const newJob = {
		title         : 'new',
		salary        : 50000,
		equity        : 0,
		companyHandle : 'c1'
	};

	test('works', async function() {
		let job = await Job.create(newJob);
		newJob.id = job.id;
		newJob.equity = '0';
		expect(job).toEqual(newJob);

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${job.id}`
		);
		expect(result.rows).toEqual([
			{
				id             : job.id,
				title          : 'new',
				salary         : 50000,
				equity         : '0',
				company_handle : 'c1'
			}
		]);
	});

	// test('bad request with dupe', async function() {
	// 	try {
	// 		await Job.create(newJob);
	// 		await Job.create(newJob);
	// 		fail();
	// 	} catch (err) {
	// 		expect(err instanceof BadRequestError).toBeTruthy();
	// 	}
	// });
});

/************************************** findAll */

describe('findAll', function() {
	test('works: no filter', async function() {
		let jobs = await Job.findAll();
		expect(jobs).toEqual([
			{
				id            : expect.any(Number),
				title         : 'j1',
				salary        : 1,
				equity        : '0.1',
				companyHandle : 'c1'
			},
			{
				id            : expect.any(Number),
				title         : 'j2',
				salary        : 2,
				equity        : '0.2',
				companyHandle : 'c2'
			},
			{
				id            : expect.any(Number),
				title         : 'j3',
				salary        : 3,
				equity        : '0.3',
				companyHandle : 'c3'
			}
		]);
	});
});

/************************************** findAllFiltered */

// describe('findAllFiltered', function() {
// 	test('works: nameLike filter', async function() {
// 		let companies = await Job.findAllFiltered(false, false, '2');
// 		expect(companies).toEqual([
// 			{
// 				handle       : 'c2',
// 				name         : 'C2',
// 				description  : 'Desc2',
// 				numEmployees : 2,
// 				logoUrl      : 'http://c2.img'
// 			}
// 		]);
// 	});
// 	test('works: minEmployees filter', async function() {
// 		let companies = await Job.findAllFiltered(2, false, false);
// 		expect(companies).toEqual([
// 			{
// 				handle       : 'c2',
// 				name         : 'C2',
// 				description  : 'Desc2',
// 				numEmployees : 2,
// 				logoUrl      : 'http://c2.img'
// 			},
// 			{
// 				handle       : 'c3',
// 				name         : 'C3',
// 				description  : 'Desc3',
// 				numEmployees : 3,
// 				logoUrl      : 'http://c3.img'
// 			}
// 		]);
// 	});
// 	test('works: maxEmployees filter', async function() {
// 		let companies = await Job.findAllFiltered(false, 2, false);
// 		expect(companies).toEqual([
// 			{
// 				handle       : 'c1',
// 				name         : 'C1',
// 				description  : 'Desc1',
// 				numEmployees : 1,
// 				logoUrl      : 'http://c1.img'
// 			},
// 			{
// 				handle       : 'c2',
// 				name         : 'C2',
// 				description  : 'Desc2',
// 				numEmployees : 2,
// 				logoUrl      : 'http://c2.img'
// 			}
// 		]);
// 	});
// 	test('works: all filters', async function() {
// 		let companies = await Job.findAllFiltered(1, 2, '1');
// 		expect(companies).toEqual([
// 			{
// 				handle       : 'c1',
// 				name         : 'C1',
// 				description  : 'Desc1',
// 				numEmployees : 1,
// 				logoUrl      : 'http://c1.img'
// 			}
// 		]);
// 	});
// });

/************************************** get */

describe('get', function() {
	test('works', async function() {
		let jobs = await Job.findAll();
		let job = await Job.get(jobs[0].id);
		expect(job).toEqual({
			id            : expect.any(Number),
			title         : 'j1',
			salary        : 1,
			equity        : '0.1',
			companyHandle : 'c1'
		});
	});

	test('not found if no such job', async function() {
		try {
			await Job.get(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** update */

describe('update', function() {
	const updateData = {
		title  : 'j11',
		salary : 10,
		equity : '0.11'
	};

	test('works', async function() {
		let jobs = await Job.findAll();
		let job = await Job.update(jobs[0].id, updateData);
		expect(job).toEqual({
			id            : jobs[0].id,
			companyhandle : jobs[0].companyHandle,
			...updateData
		});

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle
			FROM jobs
			WHERE id = ${jobs[0].id}`
		);
		expect(result.rows).toEqual([
			{
				id             : jobs[0].id,
				title          : 'j11',
				salary         : 10,
				equity         : '0.11',
				company_handle : jobs[0].companyHandle
			}
		]);
	});

	test('works: null fields', async function() {
		const updateDataSetNulls = {
			title  : 'j11',
			salary : null,
			equity : null
		};

		let jobs = await Job.findAll();
		let job = await Job.update(jobs[0].id, updateDataSetNulls);
		// updateDataSetNulls.companyHandle = jobs[0].companyHandle;
		updateDataSetNulls.companyhandle = jobs[0].companyHandle;
		expect(job).toEqual({
			id : jobs[0].id,
			...updateDataSetNulls
		});

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle
			FROM jobs
			WHERE id = ${jobs[0].id}`
		);
		expect(result.rows).toEqual([
			{
				id             : jobs[0].id,
				title          : 'j11',
				salary         : null,
				equity         : null,
				company_handle : jobs[0].companyHandle
			}
		]);
	});

	test('not found if no such job', async function() {
		try {
			await Job.update(0, updateData);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test('bad request with no data', async function() {
		try {
			let jobs = await Job.findAll();
			await Job.update(jobs[0].id, {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** remove */

describe('remove', function() {
	test('works', async function() {
		let jobs = await Job.findAll();
		await Job.remove(jobs[0].id);
		const res = await db.query(`SELECT id FROM jobs WHERE id=${jobs[0].id}`);
		expect(res.rows.length).toEqual(0);
	});

	test('not found if no such job', async function() {
		try {
			await Job.remove(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
