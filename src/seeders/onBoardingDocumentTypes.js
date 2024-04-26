// Default onboarding_document_types Insertion
const defaultOnBoardingDocumentTypes = [
    {
        name: 'Copy of Void Cheque',
        slug: 'copy_of_void_cheque',
        is_editable: false,
        is_mandatory: true,
        status: true
    },
    {
        name: 'Counter signed Offer Letter',
        slug: 'counter_signed_offer_letter',
        is_editable: false,
        is_mandatory: true,
        status: true
    },
    {
        name: 'Work authorization',
        slug: 'work_authorization',
        is_editable: false,
        is_mandatory: true,
        status: true
    },
    {
        name: "All Previous I-20's",
        slug: 'all_previous_i20s',
        is_editable: false,
        is_mandatory: true,
        status: true
    },
    {
        name: 'Signed SSN',
        slug: 'signed_ssn',
        is_editable: false,
        is_mandatory: true,
        status: true
    },
    {
        name: 'Educational Documents',
        slug: 'education_documents',
        is_editable: false,
        is_mandatory: true,
        status: true
    },
    {
        name: 'Passport',
        slug: 'passport',
        is_editable: false,
        is_mandatory: true,
        status: true
    },
    {
        name: 'I-94 Form',
        slug: 'i94',
        is_editable: false,
        is_mandatory: true,
        status: true
    },
    {
        name: "Driving License",
        slug: 'drivers_licence',
        is_editable: false,
        is_mandatory: true,
        status: true
    }
];

const onBoardingDocumentTypes = async (tenant) => {
    await tenant('onboarding_document_types').insert(defaultOnBoardingDocumentTypes);
};

module.exports = onBoardingDocumentTypes