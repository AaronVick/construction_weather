import React from 'react';
import { EmailLog } from '../../types/email';

interface EmailHistoryTableProps {
  emails: EmailLog[];
}

const EmailHistoryTable: React.FC<EmailHistoryTableProps> = ({ emails }) => {
  return (
    <div>
      {emails.length > 0 ? (
        <ul>
          {emails.map((email) => (
            <li key={email.id}>{email.subject}</li>
          ))}
        </ul>
      ) : (
        <p>No emails sent yet</p>
      )}
    </div>
  );
};

export default EmailHistoryTable;
