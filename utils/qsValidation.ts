import { BusinessCardData } from '../types';
import { normalizeCountry, STANDARD_COUNTRIES } from './countries';

export const DEFAULT_CARD_SOURCE = 'FO GUANG UNIVERSITY';

const STANDARD_COUNTRY_SET = new Set(STANDARD_COUNTRIES);

const GENERIC_EMAIL_PREFIXES = new Set([
  'info',
  'contact',
  'contacts',
  'service',
  'services',
  'admin',
  'administrator',
  'office',
  'support',
  'sales',
  'hello',
  'enquiry',
  'enquiries',
  'inquiry',
  'inquiries',
  'marketing',
  'hr',
  'press',
  'media',
  'general',
  'webmaster',
  'mail',
  'help',
  'admission',
  'admissions',
  'noreply',
  'no-reply',
]);

export function splitMultiValues(str?: string | null): string[] {
  if (!str) return [];
  return String(str)
    .split(/[\/\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isValidEmailFormat(email?: string | null): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

export function isGenericRoleEmail(email?: string | null): boolean {
  if (!email) return false;
  const localPart = email.trim().toLowerCase().split('@')[0] || '';
  return GENERIC_EMAIL_PREFIXES.has(localPart);
}

export function selectBestQsEmail(emailStr?: string | null, category?: string): string {
  const candidates = splitMultiValues(emailStr).filter(isValidEmailFormat);
  if (candidates.length === 0) return '';

  const personalCandidates = candidates.filter((e) => !isGenericRoleEmail(e));
  const pool = personalCandidates.length > 0 ? personalCandidates : candidates;

  if (pool.length === 1) return pool[0];

  const eduEmail = pool.find((e) => {
    const d = e.toLowerCase().split('@')[1] || '';
    return d.includes('.edu') || d.includes('.ac.');
  });
  const nonEduEmail = pool.find((e) => {
    const d = e.toLowerCase().split('@')[1] || '';
    return !d.includes('.edu') && !d.includes('.ac.');
  });

  if (category === 'academic') {
    return eduEmail || pool[0];
  }
  return nonEduEmail || pool[0];
}

export function isSelfInstitutionFgu(card: Partial<BusinessCardData>): boolean {
  const comp = `${card.company || ''} ${card.translations?.company || ''}`.toLowerCase();
  const emails = splitMultiValues(card.email).map((e) => e.toLowerCase());

  if (
    emails.some(
      (e) =>
        e.endsWith('@mail.fgu.edu.tw') ||
        e.endsWith('@gm.fgu.edu.tw') ||
        e.endsWith('@fgu.edu.tw')
    )
  ) {
    return true;
  }

  if (
    comp.includes('fo guang university') ||
    comp.includes('佛光大學') ||
    comp.includes('fo guang shan open university') ||
    comp.includes('fo guang shan university consortium') ||
    comp.includes('佛光山系統大學')
  ) {
    return true;
  }

  return false;
}

export function inferCountryFromCard(card: Partial<BusinessCardData>): string {
  const direct = normalizeCountry(card.country || card.translations?.country || '');
  if (direct && STANDARD_COUNTRY_SET.has(direct) && direct !== 'Other') {
    return direct;
  }

  const emails = splitMultiValues(card.email).map((e) => e.toLowerCase());
  const website = (card.website || '').toLowerCase();
  const domainText = [...emails.map((e) => e.split('@')[1] || ''), website].join(' ');
  const fullText = [
    card.company,
    card.translations?.company,
    card.address,
    card.summary,
    card.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const phone = (card.phone || '').replace(/\s+/g, '');

  const companyAndAddress = [card.company, card.translations?.company, card.address]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // 1. Explicit country indicator in Institution / Company / Address takes top priority for QS Institution Country
  if (/rwth|aachen|berlin|munich|münchen|frankfurt|germany|deutschland|德國/.test(companyAndAddress)) {
    return 'Germany';
  }
  if (
    /pierce college|san francisco state|sfsu|university of the west|moravian|vanderbilt|california|los angeles|new york|washington|texas|united states|u\.s\.a|西來大學/.test(
      companyAndAddress
    )
  ) {
    return 'United States';
  }
  if (/changwon|seoul|busan|incheon|daegu|korea|韓國|南韓|昌原/.test(companyAndAddress)) {
    return 'South Korea';
  }
  if (/dongguan|beijing|shanghai|guangzhou|shenzhen|東莞|北京|上海|廣州|深圳|中國大陸/.test(companyAndAddress)) {
    return 'China Mainland';
  }
  if (/hong kong|香港/.test(companyAndAddress)) {
    return 'Hong Kong SAR';
  }
  if (
    /taiwan|taipei|yilan|kaohsiung|taichung|tainan|hsinchu|hualien|taoyuan|keelung|台灣|臺灣|台北|臺北|新北|宜蘭|桃園|新竹|台中|臺中|台南|臺南|高雄|花蓮|成功大學|輔仁大學|政治大學|臺灣大學|清華大學|陽明交通/.test(
      companyAndAddress
    )
  ) {
    return 'Taiwan SAR';
  }

  // 2. Domain TLD matching
  if (/\.(edu|gov|org|com|net)\.tw\b|\.tw\b/.test(domainText)) return 'Taiwan SAR';
  if (/\.(edu|gov|org|com)\.hk\b|\.hk\b/.test(domainText)) return 'Hong Kong SAR';
  if (/\.(edu|gov|org|com)\.mo\b|\.mo\b/.test(domainText)) return 'Macau SAR';
  if (/\.(edu|gov|org|com)\.cn\b|\.cn\b/.test(domainText)) return 'China Mainland';
  if (/\.(ac|co|go|or|re)\.kr\b|\.kr\b/.test(domainText)) return 'South Korea';
  if (/\.(ac|co|go|or|ne)\.jp\b|\.jp\b/.test(domainText)) return 'Japan';
  if (/\.(edu|gov|com|org)\.vn\b|\.vn\b/.test(domainText)) return 'Vietnam';
  if (/\.(edu|gov|com|org)\.my\b|\.my\b/.test(domainText)) return 'Malaysia';
  if (/\.(edu|gov|com|org)\.ph\b|\.ph\b/.test(domainText)) return 'Philippines';
  if (/\.(ac|co|go|or)\.th\b|\.th\b/.test(domainText)) return 'Thailand';
  if (/\.(ac|co|go|or)\.id\b|\.id\b/.test(domainText)) return 'Indonesia';
  if (/\.(edu|gov|com|org)\.sg\b|\.sg\b/.test(domainText)) return 'Singapore';
  if (/\.(ac|ernet|edu|res|gov|co)\.in\b|\.in\b/.test(domainText)) return 'India';
  if (/\.(edu|gov|com|org)\.au\b|\.au\b/.test(domainText)) return 'Australia';
  if (/\.(ac|govt|co|org)\.nz\b|\.nz\b/.test(domainText)) return 'New Zealand';
  if (/\.(ac|gov|co|org)\.uk\b|\.uk\b/.test(domainText)) return 'United Kingdom';
  if (/\.de\b/.test(domainText)) return 'Germany';
  if (/\.fr\b/.test(domainText)) return 'France';
  if (/\.pl\b/.test(domainText)) return 'Poland';
  if (/\.cz\b/.test(domainText)) return 'Czech Republic';
  if (/\.tr\b/.test(domainText)) return 'Turkey';
  if (/\.py\b/.test(domainText)) return 'Paraguay';
  if (/\.ca\b/.test(domainText)) return 'Canada';
  if (/\.edu\b/.test(domainText) && !/\.edu\.[a-z]{2}\b/.test(domainText)) {
    return 'United States';
  }

  // 3. Summary / notes / phone prefix fallback
  if (
    phone.startsWith('+886') ||
    /taiwan|taipei|yilan|kaohsiung|taichung|tainan|hsinchu|hualien|taoyuan|keelung|台灣|臺灣|台北|臺北|新北|宜蘭|桃園|新竹|台中|臺中|台南|臺南|高雄|花蓮/.test(
      fullText
    )
  ) {
    return 'Taiwan SAR';
  }
  if (/tokyo|osaka|kyoto|fukuoka|hokkaido|japan|日本|東京|大阪|京都/.test(fullText)) {
    return 'Japan';
  }
  if (/paraguay|asunción|asuncion|巴拉圭/.test(fullText)) {
    return 'Paraguay';
  }

  return direct;
}

function isHigherEdOrResearchInstitution(card: Partial<BusinessCardData>): boolean {
  const comp = `${card.company || ''} ${card.translations?.company || ''}`.toLowerCase();
  const emails = splitMultiValues(card.email).map((e) => e.toLowerCase());

  // Exclude K-12 schools, hospitals, clinics, embassies, ministries, foundations, industry R&D trade centers
  if (
    /high school|senior high|junior high|elementary school|primary school|secondary school|maple bear|kindergarten|高級中學|高中|高職|國中|國民中學|國小|國民小學|中小學|附設醫院|醫療財團法人|hospital|clinic|診所|醫院|embassy|ministry of|county government|county council|city government|department of education|economic and cultural office|economic & cultural office|representative office|fulbright|學術交流基金會|tang prize|federation|merit time|人間福報|metal industries research|工業研究發展中心/.test(
      comp
    )
  ) {
    return false;
  }

  if (/hnps\.ntpc\.edu\.tw|ylsh\.ilc\.edu\.tw|\.k12\./.test(emails.join(' '))) {
    return false;
  }

  if (
    /university|universiti|universidad|universitas|université|universität|univerzita|uniwersytet|universitatea|college|polytechnic|institute of technology|research institutes?|research cent(er|re)|centres? for research|synchrotron|academy of sciences|academia sinica|rwth|hochschule|大學|學院|中央研究院|國家衛生研究院|同步輻射研究中心|研究院/.test(
      comp
    )
  ) {
    return true;
  }

  if (emails.some((e) => /\.(edu|ac)\b/.test(e))) {
    return true;
  }

  return false;
}

function hasAcademicFacultyOrLeadershipRank(card: Partial<BusinessCardData>): boolean {
  const text = [
    card.prefix,
    card.title,
    card.translations?.title,
    card.summary,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Note: Do NOT match "Senior Administrator" alone because it is a generic QS picklist string;
  // check actual academic/faculty/dean/president/researcher titles or PhD/Dr. ranks.
  const cleaned = text
    .replace(/\bsenior administrator\b/g, ' ')
    .replace(/\badministrator\/functional manager\b/g, ' ');

  if (
    /\b(prof\.?|professor|associate professor|assistant professor|lecturer|senior lecturer|instructor|faculty|dean|associate dean|vice dean|provost|chancellor|vice-chancellor|vice chancellor|president|vice president|vice-president|rector|vice-rector|pro-rector|chairperson|department chair|department head|head of department|head of school|fellow|researcher|research fellow|principal investigator|scientist|postdoc|post-doctoral|emeritus|scholar|ph\.?d\.?|dr\.?)\b/.test(
      cleaned
    )
  ) {
    return true;
  }

  if (
    /教授|副教授|助理教授|講師|講座|院長|副院長|校長|副校長|教務長|學務長|研發長|國際長|系主任|所長|學程主任|中心主任|研究員|副研究員|助研究員|博士|學者/.test(
      cleaned
    )
  ) {
    return true;
  }

  return false;
}

export type QsAuditIssueType =
  | 'self_institution'
  | 'missing_name'
  | 'external_org_as_staff'
  | 'academic_as_staff'
  | 'admin_staff_as_academic'
  | 'non_he_as_academic'
  | 'incomplete_non_qs';

export interface QsCategoryAuditResult {
  hasError: boolean;
  currentCategory: BusinessCardData['category'];
  suggestedCategory: BusinessCardData['category'];
  issueType?: QsAuditIssueType;
  reason?: string;
}

export function auditCardQsCategory(card: BusinessCardData): QsCategoryAuditResult {
  const current = card.category || 'other';
  const hasName = Boolean((card.firstName || '').trim() || (card.lastName || '').trim());
  const bestEmail = selectBestQsEmail(card.email, current);
  const hasValidPersonalEmail = Boolean(bestEmail && !isGenericRoleEmail(bestEmail));
  const hasCompany = Boolean((card.company || '').trim());

  // 1. Self-institution check: Fo Guang University contacts must NOT be in QS upload categories
  if (isSelfInstitutionFgu(card)) {
    if (current !== 'other') {
      return {
        hasError: true,
        currentCategory: current,
        suggestedCategory: 'other',
        issueType: 'self_institution',
        reason: '佛光大學（含系統大學總部）本機構人員，依 QS 規範不得列入自校推薦名單，應歸為「一般名片 (非 QS)」',
      };
    }
    return { hasError: false, currentCategory: current, suggestedCategory: 'other' };
  }

  // 2. Store / generic cards without a person's name must be 'other'
  if (!hasName) {
    if (current !== 'other') {
      return {
        hasError: true,
        currentCategory: current,
        suggestedCategory: 'other',
        issueType: 'missing_name',
        reason: '缺少聯絡人姓名（通用或店家名片），無法歸戶至特定審查人，應歸為「一般名片 (非 QS)」',
      };
    }
    return { hasError: false, currentCategory: current, suggestedCategory: 'other' };
  }

  const isHigherEd = isHigherEdOrResearchInstitution(card);
  const hasAcademicRank = hasAcademicFacultyOrLeadershipRank(card);

  // 3. Audit 'staff' category (strictly reserved for University non-teaching staff)
  if (current === 'staff') {
    if (!isHigherEd) {
      if (hasValidPersonalEmail && hasCompany) {
        return {
          hasError: true,
          currentCategory: current,
          suggestedCategory: 'employer',
          issueType: 'external_org_as_staff',
          reason: '非大專校院之外部企業／政府機關／使館／醫療／基金會代表，依 QS 規範應歸類為「QS Employer (雇主)」',
        };
      }
      return {
        hasError: true,
        currentCategory: current,
        suggestedCategory: 'other',
        issueType: 'incomplete_non_qs',
        reason: '非大專校院職員且缺少有效個人 Email，應歸類為「一般名片 (非 QS)」',
      };
    }

    // Higher-ed person labeled 'staff' who actually holds Dean / Professor rank (excluding "Assistant to..." / "秘書")
    const titleOnly = `${card.prefix || ''} ${card.title || ''} ${card.translations?.title || ''}`.toLowerCase();
    const isAssistantRole =
      /assistant to|executive assistant|assistant vice|secretary|助理|秘書/.test(titleOnly);
    if (
      hasValidPersonalEmail &&
      !isAssistantRole &&
      (/\b(prof\.?|professor|dean|provost|chancellor|rector)\b/.test(titleOnly) ||
        /教授|院長|教務長|研發長/.test(titleOnly))
    ) {
      return {
        hasError: true,
        currentCategory: current,
        suggestedCategory: 'academic',
        issueType: 'academic_as_staff',
        reason: '具備大學教授／院長級學術職銜，符合 QS 學者資格，建議改列「QS Academic (學者)」',
      };
    }
  }

  // 4. Audit 'academic' category
  if (current === 'academic') {
    if (!isHigherEd) {
      if (hasValidPersonalEmail && hasCompany) {
        return {
          hasError: true,
          currentCategory: current,
          suggestedCategory: 'employer',
          issueType: 'non_he_as_academic',
          reason: '所屬機構為中小學、企業或非大專學術機構，不符合 QS Academic 大專學者資格，應改列「QS Employer (雇主)」',
        };
      }
      return {
        hasError: true,
        currentCategory: current,
        suggestedCategory: 'other',
        issueType: 'incomplete_non_qs',
        reason: '非大專學術機構且缺少機構名稱或 Email，應歸為「一般名片 (非 QS)」',
      };
    }

    if (!hasAcademicRank) {
      return {
        hasError: true,
        currentCategory: current,
        suggestedCategory: 'staff',
        issueType: 'admin_staff_as_academic',
        reason: '大專校院純行政／國際事務／資訊／總務職稱（無教授、講師、院長或研究員頭銜），依 QS 規範應歸為「QS Staff (職員)」',
      };
    }
  }

  return {
    hasError: false,
    currentCategory: current,
    suggestedCategory: current,
  };
}

export interface QsReadinessCheck {
  isReady: boolean;
  effectiveEmail: string;
  effectiveCountry: string;
  blockingReasons: string[];
}

export function evaluateQsReadiness(card: BusinessCardData): QsReadinessCheck {
  const blockingReasons: string[] = [];

  if (card.category !== 'academic' && card.category !== 'employer') {
    blockingReasons.push(
      card.category === 'staff'
        ? '分類為大專行政職員 (QS Staff)，不列入 QS 學者/雇主正式上傳表'
        : '分類為一般名片 (非 QS)'
    );
  }

  if (isSelfInstitutionFgu(card)) {
    blockingReasons.push('佛光大學本機構人員（不得自校推薦）');
  }

  const firstName = (card.firstName || '').trim();
  const lastName = (card.lastName || '').trim();
  if (!firstName && !lastName) {
    blockingReasons.push('缺少姓名');
  } else if (!firstName || !lastName) {
    blockingReasons.push(!firstName ? '缺少名字 (First Name)' : '缺少姓氏 (Last Name)');
  }

  const effectiveEmail = selectBestQsEmail(card.email, card.category);
  if (!effectiveEmail) {
    blockingReasons.push('缺少有效 Email');
  } else if (isGenericRoleEmail(effectiveEmail)) {
    blockingReasons.push(`公用信箱 (${effectiveEmail}) 不符合 QS 個人信箱規範`);
  }

  if (!(card.company || '').trim()) {
    blockingReasons.push(card.category === 'academic' ? '缺少學校/學術機構名稱' : '缺少公司/機構名稱');
  }

  if (!(card.title || '').trim()) {
    blockingReasons.push('缺少職稱 (Job Title / Position)');
  }

  const effectiveCountry = inferCountryFromCard(card);
  if (!effectiveCountry) {
    blockingReasons.push('缺少國家/地區 (Country or Territory)');
  }

  const audit = auditCardQsCategory(card);
  if (audit.hasError) {
    blockingReasons.push(`分類待修正（建議改為 ${audit.suggestedCategory.toUpperCase()}）`);
  }

  return {
    isReady: blockingReasons.length === 0,
    effectiveEmail,
    effectiveCountry,
    blockingReasons,
  };
}

export interface BoundQsListSummary {
  readyCards: BusinessCardData[];
  academicCards: BusinessCardData[];
  employerCards: BusinessCardData[];
  excludedDuplicates: BusinessCardData[];
  auditIssues: Array<{ card: BusinessCardData; audit: QsCategoryAuditResult }>;
}

/**
 * 產生綁定且可直接上傳至 QS Hub 平台的乾淨名單：
 * - 僅納入通過所有必填與合規檢查的 Academic 與 Employer
 * - 自動以標準化個人 Email 及「姓名 + 機構」去重（保留欄位較完整者）
 * - 自動補齊預設 Source = FO GUANG UNIVERSITY 與標準化 Country
 */
export function getBoundQsSubmissionList(allCards: BusinessCardData[]): BoundQsListSummary {
  const auditIssues: Array<{ card: BusinessCardData; audit: QsCategoryAuditResult }> = [];
  for (const card of allCards) {
    const audit = auditCardQsCategory(card);
    if (audit.hasError) {
      auditIssues.push({ card, audit });
    }
  }

  // Score completeness so deduplication keeps the richest record
  const scoreCard = (c: BusinessCardData): number => {
    let s = 0;
    if (c.prefix) s += 1;
    if (c.department) s += 2;
    if (c.subject) s += 2;
    if (c.industry) s += 2;
    if (c.phone) s += 1;
    if (c.country) s += 2;
    if (c.syncStatus === 'notion') s += 1;
    return s;
  };

  const candidates = allCards
    .map((card) => {
      const check = evaluateQsReadiness(card);
      if (!check.isReady) return null;
      const prepared: BusinessCardData = {
        ...card,
        source: (card.source || '').trim() || DEFAULT_CARD_SOURCE,
        country: check.effectiveCountry,
        email: check.effectiveEmail,
      };
      return { card: prepared, emailKey: check.effectiveEmail.toLowerCase(), score: scoreCard(card) };
    })
    .filter((x): x is { card: BusinessCardData; emailKey: string; score: number } => Boolean(x))
    .sort((a, b) => b.score - a.score || b.card.scannedAt - a.card.scannedAt);

  const seenEmails = new Set<string>();
  const seenPersonOrg = new Set<string>();
  const readyCards: BusinessCardData[] = [];
  const excludedDuplicates: BusinessCardData[] = [];

  for (const item of candidates) {
    const personOrgKey = `${item.card.lastName.trim().toLowerCase()}|${item.card.firstName
      .trim()
      .toLowerCase()}|${item.card.company.trim().toLowerCase()}`;

    if (seenEmails.has(item.emailKey) || seenPersonOrg.has(personOrgKey)) {
      excludedDuplicates.push(item.card);
      continue;
    }

    seenEmails.add(item.emailKey);
    seenPersonOrg.add(personOrgKey);
    readyCards.push(item.card);
  }

  // Sort alphabetically by Last Name, First Name for clean QS Excel submission
  readyCards.sort((a, b) => {
    const na = `${a.lastName} ${a.firstName}`.toLowerCase();
    const nb = `${b.lastName} ${b.firstName}`.toLowerCase();
    return na.localeCompare(nb, 'en');
  });

  return {
    readyCards,
    academicCards: readyCards.filter((c) => c.category === 'academic'),
    employerCards: readyCards.filter((c) => c.category === 'employer'),
    excludedDuplicates,
    auditIssues,
  };
}

/**
 * 移除先前系統自動寫入的 `[QS 分類健檢修正 ...]` 前綴註記，保留原本分類依據或使用者自訂備註
 */
export function stripQsAuditNotes(text?: string): string {
  if (!text) return '';
  return text
    .split('\n')
    .filter((line) => !line.trim().startsWith('[QS 分類健檢修正'))
    .join('\n')
    .trim();
}

/**
 * 針對雙面名片合併後的完整欄位（包含斜線併列職稱或兼任機構），重新判定最合適的 QS 分類（不寫入任何備註文字）
 */
export function determineBestQsCategoryForMergedCard(
  card: BusinessCardData
): BusinessCardData['category'] {
  if (isSelfInstitutionFgu(card)) {
    return 'other';
  }

  const hasName = Boolean((card.firstName || '').trim() || (card.lastName || '').trim());
  if (!hasName) {
    return 'other';
  }

  const hasCompany = Boolean((card.company || '').trim());
  const isHigherEd = isHigherEdOrResearchInstitution(card);
  const hasAcademicRank = hasAcademicFacultyOrLeadershipRank(card);

  const academicEmail = selectBestQsEmail(card.email, 'academic');
  const hasValidAcademicEmail = Boolean(academicEmail && !isGenericRoleEmail(academicEmail));

  const employerEmail = selectBestQsEmail(card.email, 'employer');
  const hasValidEmployerEmail = Boolean(employerEmail && !isGenericRoleEmail(employerEmail));

  if (isHigherEd) {
    if (hasAcademicRank && hasValidAcademicEmail) {
      return 'academic';
    }
    // Check if dual-org concurrent card (e.g., University Staff + External Company Executive)
    const orgParts = splitMultiValues(card.company);
    if (orgParts.length > 1 && hasValidEmployerEmail) {
      const hasExternalOrg = orgParts.some(
        (part) => !isHigherEdOrResearchInstitution({ company: part, email: '' })
      );
      if (hasExternalOrg && !hasAcademicRank) {
        return 'employer';
      }
    }
    return hasAcademicRank ? 'academic' : 'staff';
  }

  if (hasCompany && hasValidEmployerEmail) {
    return 'employer';
  }

  const audit = auditCardQsCategory(card);
  if (audit.hasError) {
    return audit.suggestedCategory;
  }

  return card.category || 'other';
}


