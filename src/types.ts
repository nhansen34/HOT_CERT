export interface HotCertification {
  certificationId: string;
  certificationName: string;
  totalAssignments: number;
  uniqueContributors: number;
  averageAssignmentsPerDay: number;
  firstAssignmentDate: string;
  mostRecentAssignmentDate: string;
}

export interface HotCertificationsData {
  generatedAt: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  certifications: HotCertification[];
}
