import ChatInterface from "@/app/components/ChatInterface";

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col">
      <ChatInterface />
    </div>
  );
} 