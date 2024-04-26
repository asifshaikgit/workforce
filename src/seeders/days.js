// Week days
const daysData = [
  {
    id: 1,
    name: 'Monday',
    slug: 'monday',
    description: 'Day of the week - Monday',
    is_editable: false,
    created_at: new Date(),
  },
  {
    id: 2,
    name: 'Tuesday',
    slug: 'tuesday',
    description: 'Day of the week - Tuesday',
    is_editable: false,
    created_at: new Date(),
  },
  {
    id: 3,
    name: 'Wednesday',
    slug: 'wednesday',
    description: 'Day of the week - Wednesday',
    is_editable: false,
    created_at: new Date(),
  },
  {
    id: 4,
    name: 'Thursday',
    slug: 'thursday',
    description: 'Day of the week - Thursday',
    is_editable: false,
    created_at: new Date(),
  },
  {
    id: 5,
    name: 'Friday',
    slug: 'friday',
    description: 'Day of the week - Friday',
    is_editable: false,
    created_at: new Date(),
  },
  {
    id: 6,
    name: 'Saturday',
    slug: 'saturday',
    description: 'Day of the week - Saturday',
    is_editable: false,
    created_at: new Date(),
  },
  {
    id: 7,
    name: 'Sunday',
    slug: 'sunday',
    description: 'Day of the week - Sunday',
    is_editable: false,
    created_at: new Date(),
  },
];

const daysDataSeed = async (tenant) => {
  await tenant('days').insert(daysData);
};

module.exports = daysDataSeed;