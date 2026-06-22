import LLMCard from '../components/LLMCard';
import JiraCard from '../components/JiraCard';

export default function ConfigTab({ configStatus, onStatusChange }) {
  return (
    <div style={{ maxWidth: 560 }}>
      <LLMCard configStatus={configStatus.llm} onStatusChange={onStatusChange} />
      <JiraCard configStatus={configStatus.jira} onStatusChange={onStatusChange} />
    </div>
  );
}