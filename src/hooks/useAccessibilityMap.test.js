import { buildRecommendationStateFromPayload, filterAccessibilityMapJobs } from './useAccessibilityMap';

const jobCategories = [
  {
    label: '경영·사무',
    groups: [
      {
        label: '사무',
        jobs: ['회계 사무원', '총무 사무원']
      }
    ]
  },
  {
    label: '서비스',
    groups: [
      {
        label: '상담',
        jobs: ['고객 상담원']
      }
    ]
  }
];

const jobs = [
  {
    id: 'job-1',
    title: '회계 사무원',
    employmentType: '정규직',
    salaryType: '월급',
    region: '서울특별시',
    companyInfo: {
      address: '서울특별시 중구 세종대로 1'
    },
    source: {
      jobNm: '회계 사무원',
      compAddr: '서울특별시 중구 세종대로 1',
      empType: '정규직',
      salaryType: '월급'
    }
  },
  {
    id: 'job-2',
    title: '고객 상담원',
    employmentType: '계약직',
    salaryType: '시급',
    region: '경기도',
    companyInfo: {
      address: '경기도 성남시 분당구'
    },
    source: {
      jobNm: '고객 상담원',
      compAddr: '경기도 성남시 분당구',
      empType: '계약직',
      salaryType: '시급'
    }
  }
];

describe('filterAccessibilityMapJobs', () => {
  it('matches primary and secondary job category selections against descendant job names', () => {
    expect(filterAccessibilityMapJobs(jobs, { jobCategory: '경영·사무' }, jobCategories).map((job) => job.id)).toEqual(['job-1']);
    expect(filterAccessibilityMapJobs(jobs, { jobCategory: '상담' }, jobCategories).map((job) => job.id)).toEqual(['job-2']);
  });

  it('matches short region labels against full administrative names', () => {
    expect(filterAccessibilityMapJobs(jobs, { region: '서울' }, jobCategories).map((job) => job.id)).toEqual(['job-1']);
    expect(filterAccessibilityMapJobs(jobs, { region: '경기' }, jobCategories).map((job) => job.id)).toEqual(['job-2']);
  });

  it('combines job category, region, employment, and salary filters', () => {
    const filteredJobs = filterAccessibilityMapJobs(
      jobs,
      {
        jobCategory: '회계 사무원',
        region: '서울',
        employmentType: '정규직',
        salaryType: '월급'
      },
      jobCategories
    );

    expect(filteredJobs.map((job) => job.id)).toEqual(['job-1']);
  });
});

describe('buildRecommendationStateFromPayload', () => {
  it('builds map jobs from AI results when the gateway does not include a top-level jobs array', () => {
    const state = buildRecommendationStateFromPayload({
      aiEnabled: true,
      aiResponse: {
        result: {
          results: [
            {
              total_score: 82,
              score_detail: {
                accessibility_score: 78
              },
              job: {
                external_id: 'job-ai-1',
                job_nm: '사무 보조원',
                buspla_name: '브릿지워크',
                comp_addr: '서울특별시 중구 세종대로 1',
                geo_latitude: '37.5665',
                geo_longitude: '126.9780',
                emp_type: '계약직',
                salary_type: '월급',
                salary: '220만원',
                term_date: '20260531'
              }
            }
          ]
        }
      }
    });

    expect(state.status).toBe('success');
    expect(state.jobs).toHaveLength(1);
    expect(state.jobs[0]).toMatchObject({
      id: 'job-ai-1',
      title: '사무 보조원',
      company: '브릿지워크',
      score: 82,
      employmentType: '계약직',
      salaryType: '월급',
      mapPoint: {
        lat: 37.5665,
        lng: 126.978
      }
    });
    expect(state.jobs[0].accessibilityByPersona.wheelchair.detailItems).toContainEqual([
      '접근성 점수',
      '전체 추천 점수는 82점이고, 화면에는 A등급으로 표시됩니다.',
      '접근 양호'
    ]);
    expect(state.jobs[0].accessibilityByPersona.wheelchair.detailItems).toContainEqual([
      '근무지 좌표',
      '근무지 위치가 지도에 표시됩니다. 좌표는 위도 37.5665, 경도 126.9780입니다.',
      '접근 양호'
    ]);
    expect(state.jobs[0].accessibilityByPersona.wheelchair.detailItems).toContainEqual([
      '교통 접근 근거',
      '주변 대중교통/이동지원 데이터는 추가 확인이 필요합니다.',
      '주의 필요'
    ]);
  });

  it('uses difficult status for low accessibility scores', () => {
    const state = buildRecommendationStateFromPayload({
      aiEnabled: true,
      aiResponse: {
        result: {
          results: [
            {
              total_score: 47,
              score_detail: {
                accessibility_score: 47
              },
              job: {
                external_id: 'job-low-accessibility',
                job_title: '매장 보조원',
                company_name: '브릿지워크',
                work_lat: 37.5665,
                work_lng: 126.978
              }
            }
          ]
        }
      }
    });

    expect(state.jobs[0].accessibilityByPersona.wheelchair.detailItems).toContainEqual([
      '접근성 점수',
      '전체 추천 점수는 47점이고, 화면에는 C등급으로 표시됩니다.',
      '접근 어려움'
    ]);
  });

  it('keeps AI score and evidence when top-level jobs are present', () => {
    const state = buildRecommendationStateFromPayload({
      aiEnabled: true,
      jobs: [
        {
          jobPostId: 1,
          jobNm: '사무 보조원',
          busplaName: '브릿지워크',
          compAddr: '서울특별시 중구 세종대로 1',
          geoLatitude: 37.5665,
          geoLongitude: 126.978
        }
      ],
      aiResponse: {
        result: {
          results: [
            {
              total_score: 82,
              score_detail: {
                accessibility_score: 81
              },
              evidence_items: [
                {
                  source_type: 'NATIONWIDE_BUS_STOP',
                  source_name: '전국 버스정류장 위치정보',
                  distance_meters: 120
                }
              ],
              job: {
                job_post_id: 1,
                job_title: '사무 보조원'
              }
            }
          ]
        }
      }
    });

    expect(state.jobs[0].score).toBe(82);
    expect(state.jobs[0].accessibilityByPersona.wheelchair.detailItems).toContainEqual([
      '교통 접근 근거',
      '근무지 주변 대중교통 또는 교통약자 이동지원 데이터가 1건, 최근접 약 120m 확인됩니다.',
      '접근 양호'
    ]);
  });

  it('formats recruitment period fields without duplicating date ranges', () => {
    const state = buildRecommendationStateFromPayload({
      jobs: [
        {
          external_id: 'job-period-1',
          job_nm: '쇼핑몰 택배 분류원',
          buspla_name: '에스엘로지스틱스',
          comp_addr: '서울특별시 금천구',
          offerreg_dt: '20260309',
          term_date: '2026-03-09~2026-06-08'
        }
      ]
    }, false);

    expect(state.status).toBe('success');
    expect(state.jobs[0].dateRangeText).toBe('2026.03.09 ~ 2026.06.08');
    expect(state.jobs[0].dueDateText).toBe('2026.06.08 마감');
    expect(state.jobs[0].jobInfo).toContainEqual(['모집기간', '2026.03.09 ~ 2026.06.08']);
  });

  it('preserves AI evidence and required job fields for detail/explain flows', () => {
    const state = buildRecommendationStateFromPayload({
      aiEnabled: true,
      aiResponse: {
        result: {
          results: [
            {
              total_score: 84,
              reasons: ['직무분류와 공고 직무가 일치합니다.'],
              risk_factors: ['근무지 주변 보행 경로는 추가 확인이 필요합니다.'],
              evidence_items: [
                {
                  source_type: 'KEPAD_JOB_CATEGORY',
                  source_name: '장애인 고용직무분류',
                  source_table: 'pd_kepad_job_category',
                  record_id: 10,
                  description: '공고 직무와 직무분류가 매칭됩니다.',
                  fields: {
                    job_cd_nm: '사무 보조원'
                  }
                },
                {
                  source_type: 'NATIONWIDE_CROSSWALK',
                  source_name: '전국횡단보도표준데이터',
                  description: '근무지 주변 횡단보도 정보가 확인됩니다.',
                  distance_meters: 180
                }
              ],
              score_detail: {
                accessibility_score: 81
              },
              job: {
                external_id: 'job-ai-evidence',
                company_name: '브릿지워크',
                job_title: '사무 보조원',
                work_address: '서울특별시 중구 세종대로 1',
                required_career: '신입',
                required_education: '고졸',
                required_major: '무관',
                required_licenses: '컴퓨터활용능력',
                term_date: '20260531',
                work_lat: 37.5665,
                work_lng: 126.978
              }
            }
          ]
        }
      }
    });

    expect(state.status).toBe('success');
    expect(state.jobs[0].evidenceItems).toHaveLength(2);
    expect(state.jobs[0].recommendationReasons).toEqual(['직무분류와 공고 직무가 일치합니다.']);
    expect(state.jobs[0].riskFactors).toEqual(['근무지 주변 보행 경로는 추가 확인이 필요합니다.']);
    expect(state.jobs[0].jobInfo).toContainEqual(['요구경력', '신입']);
    expect(state.jobs[0].jobInfo).toContainEqual(['요구학력', '고졸']);
    expect(state.jobs[0].jobInfo).toContainEqual(['요구전공', '무관']);
    expect(state.jobs[0].jobInfo).toContainEqual(['요구자격', '컴퓨터활용능력']);
    expect(state.jobs[0].accessibilityByPersona.wheelchair.source).toContain('장애인 고용직무분류');
    expect(state.jobs[0].accessibilityByPersona.wheelchair.detailItems).toContainEqual([
      '보행 안전 근거',
      '횡단보도, 신호등, 보행 네트워크 데이터가 1건, 최근접 약 180m 확인됩니다.',
      '접근 양호'
    ]);
  });
});
