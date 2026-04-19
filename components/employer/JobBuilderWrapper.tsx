"use client";

import { JobBuilder } from "./JobBuilder";
import { createJobPosting } from "@/app/actions/employer";

interface JobBuilderWrapperProps {
  companyName?: string;
}

export function JobBuilderWrapper({ companyName = "" }: JobBuilderWrapperProps) {
  return (
    <JobBuilder
      companyName={companyName}
      onSubmit={async (data) => {
        await createJobPosting(data);
      }}
    />
  );
}
