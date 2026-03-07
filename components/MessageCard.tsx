import type { WSMessageData } from '../lib/types';
import { AssistantTextCard } from './AssistantTextCard';
import { ToolUseCard } from './ToolUseCard';
import { ToolResultCard } from './ToolResultCard';
import { ApprovalCard } from './ApprovalCard';
import { ErrorCard } from './ErrorCard';

interface Props {
  message: WSMessageData;
  sessionId: string;
}

export function MessageCard({ message, sessionId }: Props) {
  switch (message.type) {
    case 'assistant_text':
      return <AssistantTextCard text={message.data.text} />;
    case 'tool_use':
      return (
        <ToolUseCard
          toolName={message.data.tool_name}
          toolInput={message.data.tool_input}
        />
      );
    case 'tool_result':
      return (
        <ToolResultCard
          output={message.data.output}
          isError={message.data.is_error}
        />
      );
    case 'approval_request':
      return (
        <ApprovalCard
          sessionId={sessionId}
          toolName={message.data.tool_name}
          toolInput={message.data.tool_input}
          description={message.data.description}
        />
      );
    case 'error':
      return <ErrorCard message={message.data.message || 'Unknown error'} />;
    default:
      return null;
  }
}
