import { Sleep } from '@zos/sensor'; // Import the Sleep module
import { HeartRate } from '@zos/sensor';

const sleep = new Sleep();
const heart = new HeartRate();

// Function to handle the sleep button click and permissions
export function onClickSleepButton(jsonstringPermissions) {
	console.log('Sleep button pressed. in permFunctions.js');

	// Log the received JSON string of permissions
	console.log('Received JSON string of permissions:', jsonstringPermissions);

	try {
		// Parse the JSON string to access the permissions as an object
		const permissions = JSON.parse(jsonstringPermissions);

		// Log the parsed permissions object
		console.log('Parsed permissions:', permissions);

		if (permissions) {
			Object.entries(permissions).forEach(([key, value]) => {
				if (value === true) {
					console.log(`Permission for ${key} is granted.`);

					// Actual data extraction based on the granted permission
					switch (key) {
						case 'sleepScore':
							getSleepInfo('score');
							break;
						case 'startEndTime':
							getSleepInfo('startTime');
							getSleepInfo('endTime');
							break;
						case 'deepSleepTime':
							getSleepInfo('deepTime');
							break;
						case 'totalSleepTime':
							getSleepInfo('totalTime');
							break;
						case 'wakeStage':
							getStageConstantObj('WAKE_STAGE');
							break;
						case 'remStage':
							getStageConstantObj('REM_STAGE');
							break;
						case 'lightStage':
							getStageConstantObj('LIGHT_STAGE');
							break;
						case 'deepStage':
							getStageConstantObj('DEEP_STAGE');
							break;
						case 'heartRate':
							read_heartRate();
							break;
						default:
							console.log(`No action defined for permission: ${key}`);
					}
				} else {
					console.log(`Permission for ${key} is denied.`);
				}
			});
		} else {
			console.log('No permissions found in the parsed object.');
		}
	} catch (error) {
		console.error('Error parsing permissions JSON:', error);
	}
}

// Extract sleep info (getInfo method)
export function getSleepInfo(infoKey) {
	const info = sleep.getInfo();

	if (info) {
		if (info.hasOwnProperty(infoKey)) {
			console.log(`${infoKey}: ${info[infoKey]}`);
		} else {
			console.log(`No data for ${infoKey}`);
		}
	} else {
		console.log('No sleep data available');
	}
}

// Extract stage constant
export function getStageConstantObj(stageKey) {
	const sleepStageConstants = sleep.getStageConstantObj();

	if (sleepStageConstants && sleepStageConstants.hasOwnProperty(stageKey)) {
		console.log(`${stageKey}: ${sleepStageConstants[stageKey]}`);
	} else {
		console.log(`No data for ${stageKey}`);
	}
}

export function read_heartRate() {
	const callback = () => {
		console.log(heart.getCurrent());
	};
	heart.onCurrentChange(callback);
}
