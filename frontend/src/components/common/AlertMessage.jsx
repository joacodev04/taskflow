function AlertMessage({ feedback }) {
  if (!feedback) {
    return <div className="alert d-none mb-0" role="alert" />;
  }

  return (
    <div className={`alert alert-${feedback.type} mb-0`} role="alert">
      {feedback.text}
    </div>
  );
}

export default AlertMessage;
