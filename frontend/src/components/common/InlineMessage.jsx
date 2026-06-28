function InlineMessage({ message }) {
  return (
    <div className={`message-box${message ? ` alert-${message.type}` : ""}`}>
      {message?.text || ""}
    </div>
  );
}

export default InlineMessage;
