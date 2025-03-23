import { useSettings } from '../context/SettingsContext';
import { PrimaryButton } from './button';

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
                        // Save the new toggle state
                        settings.setSetting(`toggle_${key}`, JSON.stringify(newValue));
                        
                        // Log the new state to the console
                        console.log(`${key.replace(/([A-Z])/g, ' $1').trim()} has been toggled to ${newValue ? 'ON' : 'OFF'}`);
                    },
                });
            }),
        ]
    );
};
