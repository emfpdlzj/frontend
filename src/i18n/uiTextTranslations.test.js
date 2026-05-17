import { translateUiText } from './uiTextTranslations';

describe('translateUiText', () => {
  it('translates the footer slogan', () => {
    expect(translateUiText('노동을 잇는 다리, 브릿지워크', 'en')).toBe('Bridgework, connecting people to work');
    expect(translateUiText('노동을 잇는 다리, 브릿지워크', 'ja')).toBe('仕事をつなぐ橋、Bridgework');
  });

  it('translates the legal translation notice', () => {
    expect(translateUiText('법률 문서 번역 제한 안내', 'en')).toBe('Legal document translation notice');
  });

  it('translates dynamic score labels', () => {
    expect(translateUiText('73점', 'en')).toBe('73 pts');
    expect(translateUiText('73점', 'zh-CN')).toBe('73 分');
    expect(translateUiText('73점', 'ja')).toBe('73点');
  });

  it('translates home score badge criteria text', () => {
    expect(translateUiText('A등급 · 직무 기준', 'ja')).toBe('A等級 · 職務基準');
    expect(translateUiText('A등급 · 직무 기준', 'en')).toBe('Grade A · Job criteria');
    expect(translateUiText('A등급 · 직무 기준', 'zh-CN')).toBe('A 级 · 岗位标准');
  });

  it('translates numbered home filter subtitles', () => {
    expect(translateUiText('1. 희망 직무', 'ja')).toBe('1. 希望職務');
    expect(translateUiText('2. 근무지역', 'ja')).toBe('2. 勤務地域');
    expect(translateUiText('3. 고용형태', 'en')).toBe('3. Employment Type');
    expect(translateUiText('4. 급여 방식', 'zh-CN')).toBe('4. 薪资方式');
  });

  it('translates job filter option values used in filters', () => {
    expect(translateUiText('파견/용역', 'en')).toBe('Dispatch/contract work');
    expect(translateUiText('상용직', 'en')).toBe('Regular employment');
    expect(translateUiText('월급', 'en')).toBe('Monthly pay');
    expect(translateUiText('회사 내규에 따름', 'en')).toBe('By company policy');
    expect(translateUiText('관리직(임원·부서장)', 'en')).toBe('Management (executives/team heads)');
  });

  it('translates selected job category paths without changing separators', () => {
    expect(translateUiText('의회의원·고위공무원 및 기업 고위임원 > 의회 의원', 'en')).toBe(
      'Legislators, senior officials, executives > Legislator'
    );
  });
});
