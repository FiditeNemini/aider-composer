import { css } from '@emotion/css';
import { RefreshCw } from 'lucide-react';
import Markdown, {
  type Components as MarkdownComponents,
} from 'react-markdown';
import ScrollArea, { ScrollAreaRef } from '../../components/scrollArea';
import {
  ChatAssistantMessage,
  ChatMessage,
  ChatUserMessage,
} from '../../types';
import { useChatStore } from '../../stores/useChatStore';
import { memo, useEffect, useMemo, useRef } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';

const messageItemStyle = css({
  marginBottom: '16px',
  // whiteSpace: 'pre-wrap',
  '& h1': {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    lineHeight: '1.25',
    margin: '0.5rem 0',
  },
  '& h2': {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    lineHeight: '1.25',
    margin: '0.5rem 0',
  },
  '& pre': {
    overflow: 'auto hidden',
    width: '100%',
    maxWidth: '100%',
    backgroundColor: 'var(--vscode-editor-background)',
    borderRadius: '4px',
    padding: '4px',

    '& code': {
      backgroundColor: 'transparent',
      fontFamily: 'var(--vscode-editor-font-family)',
    },
  },
  '& .hljs': {
    backgroundColor: 'transparent',
  },
});

function ChatUserMessageItem(props: { message: ChatUserMessage }) {
  const { message } = props;

  return (
    <div
      className={messageItemStyle}
      style={{
        backgroundColor: 'var(--vscode-input-background)',
        borderRadius: '4px',
        padding: '4px',
        marginBottom: '16px',
        whiteSpace: 'pre-wrap',
      }}
    >
      {message.reflected ? (
        message.displayText
      ) : (
        <Markdown>{message.displayText}</Markdown>
      )}
    </div>
  );
}

const code: MarkdownComponents['code'] = (props) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { children, className, node, ...rest } = props;
  const match = /language-(\w+)/.exec(className || '');
  return match ? (
    // @ts-expect-error ref is not compatible with SyntaxHighlighter, but it's not used
    <SyntaxHighlighter
      {...rest}
      PreTag="div"
      children={String(children)}
      language={match[1]}
      useInlineStyles={false}
      // style={hljsStyle}
    />
  ) : (
    <code {...rest} className={className}>
      {children}
    </code>
  );
};

function ChatAssistantMessageItem(props: {
  message: ChatAssistantMessage;
  useComponents?: boolean;
}) {
  const { message, useComponents = true } = props;

  return (
    <div className={messageItemStyle}>
      <Markdown components={useComponents ? { code } : undefined}>
        {message.text}
      </Markdown>
      {message.usage && (
        <div
          style={{
            padding: '6px',
            backgroundColor: 'var(--vscode-notifications-background)',
            borderRadius: '4px',
            marginTop: '8px',
          }}
        >
          {message.usage}
        </div>
      )}
    </div>
  );
}

const ChatMessageItem = memo(function ChatMessageItem(props: {
  message: ChatMessage;
  useComponents?: boolean;
}) {
  const { message, useComponents } = props;

  if (message.type === 'user') {
    return <ChatUserMessageItem message={message} />;
  } else if (message.type === 'assistant') {
    return (
      <ChatAssistantMessageItem
        message={message}
        useComponents={useComponents}
      />
    );
  }

  return null;
});

export default function ChatMessageList() {
  const { history, current, isEditorWorking } = useChatStore();

  const scrollAreaRef = useRef<ScrollAreaRef>(null);

  const historyItems = useMemo(() => {
    return (
      <>
        {history.map((message) => (
          <ChatMessageItem key={message.id} message={message} />
        ))}
      </>
    );
  }, [history]);

  useEffect(() => {
    const last = history[history.length - 1];
    if (last && last.type === 'user') {
      scrollAreaRef.current?.scrollToBottom();
    }
  }, [history]);

  let currentItem: React.ReactNode;
  if (current) {
    if (current.text) {
      currentItem = (
        // current may change very fast, so use components may cause performance issue
        <ChatMessageItem
          key={current.id}
          message={current}
          useComponents={false}
        />
      );
    } else {
      currentItem = (
        <div>
          <RefreshCw
            size={16}
            style={{
              animation: 'spin 2s linear infinite',
            }}
          />
        </div>
      );
    }
  }

  return (
    <ScrollArea
      style={{ padding: '1rem', flexGrow: 1 }}
      disableX
      ref={scrollAreaRef}
    >
      <div style={{ lineHeight: '1.6' }}>
        {historyItems}
        {currentItem}
        {isEditorWorking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw
              size={16}
              style={{
                animation: 'spin 2s linear infinite',
              }}
            />
            <span>Editor is working, please wait...</span>
          </div>
        )}
      </div>
      <div style={{ minHeight: '50vh' }}></div>
    </ScrollArea>
  );
}
