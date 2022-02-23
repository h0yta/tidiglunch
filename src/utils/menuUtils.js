const dateUtils = require('./dateUtils');

const createEmptyJson = (resturant) => {
  return {
    "resturant": resturant,
    "week": dateUtils.currentWeekNumber(),
    "days": createDays()
  }
}

const createDays = (resturant) => {
  return dateUtils.getDays().map(day => {
    return { day, "lunches": [] }
  })
}

module.exports.createEmptyJson = createEmptyJson;