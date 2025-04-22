import { BaseApp } from '@zeppos/zml/base-app';
import EasyStorage, { EasyTSDB } from '@silver-zepp/easy-storage';
import HRMonitor from './app-service/hrMonitor.js'; // Used for the heart rate monitoring service
import * as appSideService from '@zos/app-side';

/**
 * The watch hosts two main storages: EasyStorage and EasyTSDB.
 * EasyStorage is a key-value storage, and EasyTSDB is a time-series database.
 * These tools can only be used on the watch side (i.e., pages, background service)
 */
const storage = new EasyStorage();
const tsdb = new EasyTSDB({ directory: 'myalyce_data' }); // TODO: add parameters?

App(
	BaseApp({
		globals: {
			storage: storage,
			tsdb: tsdb,
			appSideService: appSideService,
		},
		onCreate() {
			console.log('app invoke onCreate');
			HRMonitor.start(); // Start heart rate tracking when app starts
		},
		onDestroy(opts) {
			console.log('app invoke onDestroy');
			tsdb.databaseClose();
		},
	}),
);
