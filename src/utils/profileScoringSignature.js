const SCORING_PROFILE_FIELDS = [
  'targetJob',
  'desiredJob',
  'skills',
  'highestEducation',
  'educationSummary',
  'majorCareer',
  'careerSummary',
  'careerDetail',
  'projectExperience',
  'certifications',
  'disabilityType',
  'disabilitySeverity',
  'assistiveDevices',
  'workSupportRequirements',
  'requiredSupports',
  'workTypes',
  'workAvailability',
  'expectedSalary',
  'workTimePreference',
  'remoteAvailableYn',
  'mobilityRange',
  'commuteRange',
  'selfIntroduction',
  'motivation',
  'jobFitDescription',
  'careerGoal',
  'strengthsWeaknesses'
];

const normalizeSignatureValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeSignatureValue).filter((item) => item !== '');
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = normalizeSignatureValue(value[key]);
        return result;
      }, {});
  }

  return String(value ?? '').trim();
};

const createStableHash = (value) => {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
};

export const getProfileScoringSignature = (profile) => {
  if (!profile) {
    return '';
  }

  const signatureSource = SCORING_PROFILE_FIELDS.reduce((result, field) => {
    result[field] = normalizeSignatureValue(profile[field]);
    return result;
  }, {});

  return createStableHash(JSON.stringify(signatureSource));
};
