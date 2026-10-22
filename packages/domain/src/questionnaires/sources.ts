export const scoreSources = [
  'phq9_bands',
  'phq8_bands',
  'gad7_bands',
  'pcl5_cutoff_br',
  'pcl5_dsm5_rule',
  'asrs_continuous',
  'asrs_shaded',
  'k10_abs',
  'k6_cutoff',
] as const

export type ScoreSource = (typeof scoreSources)[number]

export interface SourceReference {
  citation: string
  url: string
}

export const scoreSourceReferences: Readonly<Record<ScoreSource, SourceReference>> = {
  phq9_bands: {
    citation:
      'Kroenke K, Spitzer RL, Williams JBW. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med 2001;16:606-613. PHQ Instruction Manual (Pfizer): 5, 10, 15 and 20 mark mild, moderate, moderately severe and severe.',
    url: 'https://www.phqscreeners.com/images/sites/g/files/g10016261/f/201412/instructions.pdf',
  },
  phq8_bands: {
    citation:
      'Kroenke K, et al. The PHQ-8 as a measure of current depression in the general population. J Affect Disord 2009;114:163-173. PHQ Instruction Manual (Pfizer): cutpoints on the PHQ-8 are identical to the PHQ-9.',
    url: 'https://www.phqscreeners.com/images/sites/g/files/g10016261/f/201412/instructions.pdf',
  },
  gad7_bands: {
    citation:
      'Spitzer RL, Kroenke K, Williams JBW, Löwe B. A brief measure for assessing generalized anxiety disorder: the GAD-7. Arch Intern Med 2006;166:1092-1097. PHQ Instruction Manual (Pfizer): 5, 10 and 15 mark mild, moderate and severe.',
    url: 'https://www.phqscreeners.com/images/sites/g/files/g10016261/f/201412/instructions.pdf',
  },
  pcl5_cutoff_br: {
    citation:
      'Pereira-Lima K, et al. Psychometric properties and diagnostic utility of a Brazilian version of the PCL-5 (complete and abbreviated versions). Eur J Psychotraumatol 2019;10(1):1581020. Cutoff point 36 for the complete Brazilian version (sensitivity 0.94, specificity 0.71, against SCID-5-CV).',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6442082/',
  },
  pcl5_dsm5_rule: {
    citation:
      'VA National Center for PTSD. PTSD Checklist for DSM-5 (PCL-5): each item rated 2 = "Moderately" or higher counts as a symptom endorsed; the DSM-5 rule requires at least 1 B item (1-5), 1 C item (6-7), 2 D items (8-14) and 2 E items (15-20).',
    url: 'https://www.ptsd.va.gov/professional/assessment/adult-sr/ptsd-checklist.asp',
  },
  asrs_continuous: {
    citation:
      'Harvard Medical School, National Comorbidity Survey. ASRS v1.1 Screener (6Q) Scoring Update, February 2024: 0-4 per item, total 0-24, positive at 14 or more (0-9 low negative, 10-13 high negative, 14-17 low positive, 18-24 high positive). Kessler RC, et al. Int J Methods Psychiatr Res 2007;16:52-65.',
    url: 'https://www.hcp.med.harvard.edu/ncs/asrs.php',
  },
  asrs_shaded: {
    citation:
      'ASRS v1.1 official instructions: four or more marks in the darkly shaded boxes of Part A are highly consistent with ADHD in adults and warrant further investigation. Kessler RC, et al. Psychol Med 2005;35:245-256.',
    url: 'https://license.tov.med.nyu.edu/product/asrs6Qscreener',
  },
  k10_abs: {
    citation:
      "Australian Bureau of Statistics. National Survey of Mental Health and Wellbeing 2007: Users' Guide. 10-15 low, 16-21 moderate, 22-29 high, 30-50 very high. The ABS notes that there are no universally accepted K10 categories.",
    url: 'https://www.abs.gov.au/AUSSTATS/abs@.nsf/7d12b0f6763c78caca257061001cc588/24e1d55224566b88ca257559001272fc!OpenDocument',
  },
  k6_cutoff: {
    citation:
      'Kessler RC, et al. Screening for serious mental illness in the general population. Arch Gen Psychiatry 2003;60(2):184-189. A K6 score of 13 or more indicates serious psychological distress.',
    url: 'https://www.hcp.med.harvard.edu/ncs/k6_scales.php',
  },
}
