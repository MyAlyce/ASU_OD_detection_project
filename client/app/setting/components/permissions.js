import { useSettings } from '../context/SettingsContext';

/**
 * Permissions component for toggling the different permissions
 */
export const Permissions = () => {
    const settings = useSettings();
    const email = settings.getEmail();
    console.log(email);



    // Main component render
    return View(
        { style: { display: 'flex', flexDirection: 'column', gap: '15px' } },
        [
            // Title and description
            View({}, [
                Text(
                    { style: { fontSize: '14px', fontWeight: 'bold' } },
                    'Permissions'
                ),
            ]),

            // Toggle switches with saved state
            ...[
                'sleepScore',
                'startEndTime',
                'deepSleepTime',
                'totalSleepTime',
                'wakeStage',
                'remStage',
                'lightStage',
                'deepStage',
                'heartRate',
            ].map(key => {
                const savedState = settings.getSetting(`toggle_${key}`);
                const isToggled = savedState !== null ? JSON.parse(savedState) : false;

                return Toggle({
                    label: Text(
                        { style: { fontSize: '12px' } },
                        key.replace(/([A-Z])/g, ' $1').trim() // Convert camelCase to readable text
                    ),
                    value: isToggled,
                    onChange: (newValue) => {
                        // Save the new toggle state in settings storage
                        settings.setSetting(`toggle_${key}`, JSON.stringify(newValue));

                        // Get all current permission settings to sync with device
                        try {
                            const allSettings = {};

                            // Build a complete permissions object from all toggle settings
                            [
                                'sleepScore',
                                'startEndTime',
                                'deepSleepTime',
                                'totalSleepTime',
                                'wakeStage',
                                'remStage',
                                'lightStage',
                                'deepStage',
                                'heartRate',
                            ].forEach(permKey => {
                                // For the current key being changed, use the new value
                                if (permKey === key) {
                                    allSettings[permKey] = newValue;
                                } else {
                                    // For other keys, get their current value from settings
                                    const savedState = settings.getSetting(`toggle_${permKey}`);
                                    allSettings[permKey] = savedState !== null ? JSON.parse(savedState) : false;
                                }
                            });

                            // Add timestamp to permissions object directly
                            const currentTime = new Date().getTime();
                            allSettings.timestamp = currentTime;

                            // Store a special key in settings that will trigger the onSettingsChange handler in app-side
                            // The app-side service will detect this change and sync permissions to the device
                            const syncData = {
                                permissions: allSettings,
                                timestamp: currentTime // Add timestamp to ensure it's seen as a change
                            };

                            console.log('DEBUG: About to sync permissions:', JSON.stringify(syncData));
                            settings.setSetting('permissions_sync', JSON.stringify(syncData));

                            // Add a visual indicator that sync was attempted (using console.log instead of alert)
                            console.log('DEBUG: Permissions sync initiated. Check device app.');
                            console.log('DEBUG: Stored permissions for sync with device app');
                        } catch (error) {
                            console.error('Error preparing permissions for sync:', error);
                        }

                        // Log the new state to the console
                        console.log(`${key.replace(/([A-Z])/g, ' $1').trim()} has been toggled to ${newValue ? 'ON' : 'OFF'}`);
                    },
                });
            }),
        ]
    );
};
