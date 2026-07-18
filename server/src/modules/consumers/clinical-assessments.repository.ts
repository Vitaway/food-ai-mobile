import { AppDataSource } from "../../config/database";
import { ConsumerClinicalAssessment } from "./clinical-assessment.entity";

class ClinicalAssessmentsRepository {
  private get repo() {
    return AppDataSource.getRepository(ConsumerClinicalAssessment);
  }

  findByClientId(clientId: string) {
    return this.repo.findOne({ where: { clientId } });
  }

  list() {
    return this.repo.find({ order: { updatedAt: "DESC" } });
  }

  create(data: Partial<ConsumerClinicalAssessment>) {
    return this.repo.create(data);
  }

  save(assessment: ConsumerClinicalAssessment) {
    return this.repo.save(assessment);
  }
}

export const clinicalAssessmentsRepository = new ClinicalAssessmentsRepository();
