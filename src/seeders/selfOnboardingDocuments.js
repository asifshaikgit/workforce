//Self onboarding document types
const SelfOnboardingData = [
  {
    name: 'Copy of Void Check',
    is_active: true,
    is_editable: false,
    slug: 'void_cheque',
    description: '',
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'Countersigned offer letter',
    is_active: true,
    is_editable: false,
    slug: '',
    description: '',
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'Work Authorization',
    is_active: true,
    is_editable: false,
    slug: 'work_authorization',
    description: '',
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'All Previous I-20\'s',
    is_active: true,
    is_editable: false,
    slug: '',
    description: '',
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'Signed SSN',
    is_active: true,
    is_editable: false,
    slug: 'ssn',
    description: '',
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'Education Documents',
    is_active: true,
    is_editable: false,
    slug: '',
    description: '',
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'Passport',
    is_active: true,
    is_editable: false,
    slug: 'passport',
    description: '',
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'I-94',
    is_active: true,
    is_editable: false,
    slug: 'i-94',
    description: '',
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'Driver\'s License',
    is_active: true,
    is_editable: false,
    slug: 'drivers_license',
    description: '',
    created_at: new Date(),
    created_by: null,
  }
];

const selfOnboardingDataSeed = async (tenant) => {
  // await tenant('self_onboarding_documents').insert(SelfOnboardingData);
};

module.exports = selfOnboardingDataSeed;