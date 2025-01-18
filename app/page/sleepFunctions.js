import { Sleep } from '@zos/sensor';

const sleep = new Sleep();

/**
 * Extract sleep information by key.
 * @param {string} infoKey - The key to retrieve from sleep.getInfo().
 */
export const getSleepInfo = (infoKey) => {
    const info = sleep.getInfo();
    if (info && Object.prototype.hasOwnProperty.call(info, infoKey)) {
        console.log(`${infoKey}: ${info[infoKey]}`);
    } else {
        console.warn(`No data available for ${infoKey}.`);
    }
};

/**
 * Extract sleep stage constant by key.
 * @param {string} stageKey - The key to retrieve from sleep.getStageConstantObj().
 */
export const getStageConstantObj = (stageKey) => {
    const sleepStageConstants = sleep.getStageConstantObj();
    if (sleepStageConstants && Object.prototype.hasOwnProperty.call(sleepStageConstants, stageKey)) {
        console.log(`${stageKey}: ${sleepStageConstants[stageKey]}`);
    } else {
        console.warn(`No data available for ${stageKey}.`);
    }
};

/**
 * Handle the sleep button click.
 * @param {object} permissions - The permissions object containing permission states.
 */
export const handleSleepButtonClick = (permissions) => {
    console.log('Sleep button pressed');
    console.log('Current permissions:', JSON.stringify(permissions, null, 2));

    // Ensure permissions object is valid
    if (permissions) {
        Object.entries(permissions).forEach(([key, value]) => {
            if (value === true) {
                console.log(`Permission for ${key} is granted.`);

                // Extract and log data based on the granted permission
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
                    default:
                        console.log(`No action defined for permission: ${key}`);
                }
            } else {
                console.warn(`Permission for ${key} is denied.`);
            }
        });
    } else {
        console.warn('No permissions object provided.');
    }
};
