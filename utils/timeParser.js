// utils/timeParser.js
const parseTime = (timeStr) => {
    const timeRegex = /(\d+)\s*([a-z]+)/g;
    let totalMilliseconds = 0;

    const timeUnits = {
        s: 1000,
        sec: 1000,
        secs: 1000,
        second: 1000,
        seconds: 1000,
        m: 60 * 1000,
        min: 60 * 1000,
        mins: 60 * 1000,
        minute: 60 * 1000,
        minutes: 60 * 1000,
        h: 60 * 60 * 1000,
        hr: 60 * 60 * 1000,
        hrs: 60 * 60 * 1000,
        hour: 60 * 60 * 1000,
        hours: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        weeks: 7 * 24 * 60 * 60 * 1000
    };

    let matches;
    while ((matches = timeRegex.exec(timeStr)) !== null) {
        const value = parseInt(matches[1]);
        const unit = matches[2].toLowerCase();

        if (!timeUnits[unit]) {
            throw new Error(`Invalid time unit: ${unit}`);
        }

        totalMilliseconds += value * timeUnits[unit];
    }

    if (totalMilliseconds === 0) {
        throw new Error('Invalid time format');
    }

    return totalMilliseconds;
};

module.exports = parseTime;
