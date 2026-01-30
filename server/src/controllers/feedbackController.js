const prisma = require('../config/db');

// 12. LOCATION-BASED PATIENT FEEDBACK
const submitFeedback = async (req, res) => {
    const { latitude, longitude, options, comment, patientId, doctorId, isAnonymous } = req.body;

    // 12.1 Feedback Availability Rule (Geofence Check)
    // Hospital Coordinates (Example: 28.6139, 77.2090 - New Delhi - Placeholder)
    // You should configure this via ENV or Admin Settings
    const HOSPITAL_LAT = 28.6139;
    const HOSPITAL_LNG = 77.2090;
    const RADIUS_KM = 0.5; // 500 meters

    const distance = getDistanceFromLatLonInKm(latitude, longitude, HOSPITAL_LAT, HOSPITAL_LNG);
    const isInside = distance <= RADIUS_KM;

    try {
        const feedback = await prisma.feedback.create({
            data: {
                patientId: patientId ? parseInt(patientId) : null,
                doctorId: doctorId ? parseInt(doctorId) : null,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                isInside,
                options: JSON.stringify(options),
                comment,
                isAnonymous: isAnonymous || false
            }
        });

        if (!isInside) {
            return res.status(403).json({
                error: 'You must be inside the hospital to submit feedback.',
                distance: `${distance.toFixed(2)} km`
            });
        }

        res.json({ message: 'Feedback submitted successfully', feedback });
    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ error: 'Error submitting feedback' });
    }
};

const getFeedback = async (req, res) => {
    try {
        const feedback = await prisma.feedback.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                patient: { select: { name: true } },
                doctor: { include: { user: { select: { name: true } } } }
            }
        });
        res.json(feedback);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching feedback' });
    }
};

// Haversine Formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

module.exports = { submitFeedback, getFeedback };
