export interface ApplicationQuestion {
  id: string;
  question: string;
  type: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  postedDate: string;
  shortDescription: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  preferred?: string[];
  salary?: string;
  applicationEmail: string;
  applicationQuestions?: ApplicationQuestion[];
}