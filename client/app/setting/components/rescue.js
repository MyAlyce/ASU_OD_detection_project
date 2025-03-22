import { useSettings } from '../context/SettingsContext';
import { PrimaryButton } from './button';

/**
 * Rescue Plan component for emergency file access
 * Allows setting up automated sharing if user doesn't check in
 */
export const RescuePlan = () => {
	const settings = useSettings();
	const email = settings.getEmail();
	console.log(email);
	// Get rescue settings or initialize with defaults
	const getRescueSettings = () => {
		try {
			return (
				JSON.parse(settings.getSetting(`rescueSettings_${email}`)) || {
					isEnabled: false,
					checkInPeriod: 30, // days
					lastCheckIn: new Date().toISOString(),
				}
			);
		} catch (e) {
			console.error('Error parsing rescue settings', e);
			return {
				isEnabled: false,
				checkInPeriod: 30,
				lastCheckIn: new Date().toISOString(),
			};
		}
	};

	const rescueSettings = getRescueSettings();

	// Save updated rescue settings
	const saveRescueSettings = (updatedSettings) => {
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

	// Update check-in period
	const updateCheckInPeriod = (value) => {
		const days = parseInt(value, 10);
		if (!isNaN(days) && days > 0) {
			const updated = { ...rescueSettings, checkInPeriod: days };
			saveRescueSettings(updated);
		}
	};

	// Check in now
	const checkIn = () => {
		const updated = {
			...rescueSettings,
			lastCheckIn: new Date().toISOString(),
		};
		saveRescueSettings(updated);
	};

	// Calculate days since last check-in
	const daysSinceCheckIn = () => {
		const lastCheckIn = new Date(rescueSettings.lastCheckIn);
		const now = new Date();
		const diffTime = Math.abs(now - lastCheckIn);
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	};

	// Main component render
	return View(
		{ style: { display: 'flex', flexDirection: 'column', gap: '15px' } },
		[
			// Title and description
			View({}, [
				Text(
					{ style: { fontSize: '14px', fontWeight: 'bold' } },
					'Rescue Plan',
				),
				Text(
					{ style: { fontSize: '12px', color: '#555', marginTop: '5px' } },
					'Safety check-in system',
				),
			]),

			// Toggle switch
			Toggle({
				label: Text({ style: { fontSize: '12px' } }, 'Enable Rescue Plan'),
				value: rescueSettings.isEnabled,
				onChange: toggleRescuePlan,
			}),

			// Check-in period input
			rescueSettings.isEnabled &&
				View({ style: { marginTop: '5px' } }, [
					Text(
						{ style: { fontSize: '12px', marginBottom: '5px' } },
						'Check-in period (days):',
					),
					Slider({
						label: `${rescueSettings.checkInPeriod} days`,
						min: 7,
						max: 90,
						value: rescueSettings.checkInPeriod,
						onChange: updateCheckInPeriod,
					}),
				]),

			// Last check-in info
			rescueSettings.isEnabled &&
				View({ style: { marginTop: '5px' } }, [
					Text(
						{ style: { fontSize: '12px', color: '#555' } },
						`Last check-in: ${daysSinceCheckIn()} days ago`,
					),
					PrimaryButton({
						label: 'Check in now',
						onClick: checkIn,
					}),
				]),
		],
	);
};