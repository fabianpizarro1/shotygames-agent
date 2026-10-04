import { hoyEC } from '@/lib/fecha';
import ChatIA from '@/components/ChatIA';

export default function IAPage() {
  return <ChatIA fecha={hoyEC()} />;
}
