import JiraInput from '../components/JiraInput';
import FileInput from '../components/FileInput';
import ScreenshotInput from '../components/ScreenshotInput';

export default function InputTab({ configStatus, context, onContextChange }) {
  const update = patch => onContextChange(prev => ({ ...prev, ...patch }));
  const hasInput = context.jiraIssue || context.fileText || context.screenshotB64;
  return (
    <div>
      <div style={{ display: 'flex', gap: 12 }}>
        <JiraInput isJiraConfigured={configStatus.jira?.configured} onIssueChange={(issue, projectId) => update({ jiraIssue: issue, projectId, source: context.fileText ? 'mixed' : 'jira' })} />
        <FileInput onFileChange={(text) => update({ fileText: text, source: context.jiraIssue ? 'mixed' : 'file' })} />
        <ScreenshotInput onScreenshotChange={(b64) => update({ screenshotB64: b64 })} />
      </div>
      {hasInput && <div style={{ marginTop: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 6, fontSize: 13, color: '#166534' }}>Input ready — go to Generate tab</div>}
    </div>
  );
}
