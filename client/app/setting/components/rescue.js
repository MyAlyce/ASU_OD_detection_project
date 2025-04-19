import { useSettings } from '../context/SettingsContext';
import { PrimaryButton } from './button';
import { Input } from './textInput';

/**
 * Rescue Plan component for emergency heart rate monitoring
 * Allows setting up automated alerts when heart rate exceeds threshold
 */
export const RescuePlan = () => {
	console.log('[RescuePlan] Initializing component...');
	const settings = useSettings();
	const email = settings.getEmail();
	console.log(`[RescuePlan] User email: ${email}`);

	// Get rescue settings or initialize with defaults
	const getRescueSettings = () => {
		try {
			return (
				JSON.parse(settings.getSetting(`rescueSettings_${email}`)) || {
					isEnabled: false,
					maxHeartRate: 120, // Default maximum heart rate
					emergencyPhones: [], // Array of emergency phone numbers
				}
			);
		} catch (e) {
			console.error('Error parsing rescue settings', e);
			return {
				isEnabled: false,
				maxHeartRate: 120,
				emergencyPhones: [],
			};
		}
	};

	const rescueSettings = getRescueSettings();
	console.log(`[Rescue Plan] Settings:`, rescueSettings);

	// Save updated rescue settings
	const saveRescueSettings = (updatedSettings) => {
		console.log('Saving rescue settings:', updatedSettings);
		settings.setSetting(
			`rescueSettings_${email}`,
			JSON.stringify(updatedSettings),
		);
	};

	// Toggle rescue plan enabled/disabled
	const toggleRescuePlan = () => {
		const updated = { ...rescueSettings, isEnabled: !rescueSettings.isEnabled };
		saveRescueSettings(updated);
	};

	// Update maximum heart rate threshold
	const updateMaxHeartRate = (value) => {
		const rate = parseInt(value, 10);
		if (!isNaN(rate) && rate > 59 && rate < 201) {
			// Reasonable heart rate range
			const updated = { ...rescueSettings, maxHeartRate: rate };
			saveRescueSettings(updated);
		}
	};

	// Validate phone number format
	const isValidPhoneNumber = (phone) => {
		const phoneRegex = /^\+?[\d\s-]{10,}$/; // Basic phone validation
		return phoneRegex.test(phone);
	};

	// Add emergency phone number
	const addEmergencyPhone = (phone) => {
		if (!isValidPhoneNumber(phone)) {
			console.error('Invalid phone number format');
			return false;
		}

		const formattedPhone = phone.replace(/[\s-]/g, ''); // Remove spaces and dashes
		if (!rescueSettings.emergencyPhones.includes(formattedPhone)) {
			const updated = {
				...rescueSettings,
				emergencyPhones: [...rescueSettings.emergencyPhones, formattedPhone],
			};
			saveRescueSettings(updated);
			return true;
		}
		return false;
	};

	// Remove emergency phone number
	const removeEmergencyPhone = (phone) => {
		const updated = {
			...rescueSettings,
			emergencyPhones: rescueSettings.emergencyPhones.filter(
				(p) => p !== phone,
			),
		};
		saveRescueSettings(updated);
	};

	// Main component render
	return View(
		{ style: { display: 'flex', flexDirection: 'column', gap: '15px' } },
		[
			// Title and description
			View({}, [
				Text(
					{ style: { fontSize: '14px', fontWeight: 'bold' } },
					'Heart Rate Alert System',
				),
				Text(
					{
						style: {
							fontSize: '12px',
							color: '#555',
							marginTop: '5px',
							marginLeft: '16px',
						},
					},
					'Set maximum heart rate threshold for emergency alerts',
				),
			]),

			// Toggle switch
			Toggle({
				label: Text(
					{ style: { fontSize: '12px' } },
					'Enable Heart Rate Alerts',
				),
				value: rescueSettings.isEnabled,
				onChange: toggleRescuePlan,
			}),

			// Settings when enabled
			rescueSettings.isEnabled &&
				View({ style: { marginTop: '5px' } }, [
					// Maximum heart rate slider
					Text(
						{ style: { fontSize: '12px', marginBottom: '5px' } },
						'Maximum Heart Rate (BPM):',
					),
					Slider({
						label: `${rescueSettings.maxHeartRate} BPM`,
						min: 59,
						max: 201,
						value: rescueSettings.maxHeartRate,
						onChange: updateMaxHeartRate,
					}),

					// Phone number input
					View({ style: { marginTop: '15px' } }, [
						Text(
							{ style: { fontSize: '12px', marginBottom: '5px' } },
							'Emergency Contact Numbers:',
						),
						Input('Add Emergency Phone', '+1 234-567-8900', (value) => {
							if (addEmergencyPhone(value)) {
								// Clear input or show success message
								console.log('Phone number added successfully');
							} else {
								// Show error message
								console.log('Failed to add phone number');
							}
						}),
					]),

					// Display registered phone numbers
					View({ style: { marginTop: '10px' } }, [
						...rescueSettings.emergencyPhones.map((phone) =>
							View(
								{
									style: {
										display: 'flex',
										flexDirection: 'row',
										justifyContent: 'space-between',
										alignItems: 'center',
										marginBottom: '5px',
										padding: '5px',
										backgroundColor: 'rgba(0,0,0,0.05)',
										borderRadius: '4px',
									},
								},
								[
									Text({ style: { fontSize: '12px' } }, phone),
									PrimaryButton({
										label: '×',
										onClick: () => removeEmergencyPhone(phone),
										style: {
											padding: '2px 8px',
											fontSize: '14px',
											minWidth: 'auto',
										},
									}),
								],
							),
						),
					]),

					// Information text
					Text(
						{
							style: {
								fontSize: '12px',
								color: '#555',
								marginTop: '15px',
								marginLeft: '16px',
							},
						},
						'Emergency calls will be made to these numbers if your heart rate exceeds the threshold.',
					),
				]),
		],
	);
};
