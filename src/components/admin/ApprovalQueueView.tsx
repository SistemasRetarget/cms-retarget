import React from "react";
import { Gutter } from "@payloadcms/ui";
import type { AdminViewServerProps } from "payload";
import ApprovalQueue from "./ApprovalQueue";

const ApprovalQueueView: React.FC<AdminViewServerProps> = () => {
  return (
    <Gutter>
      <div style={{ padding: "1.5rem 0" }}>
        <ApprovalQueue />
      </div>
    </Gutter>
  );
};

export default ApprovalQueueView;
