import { Comment } from "@/types/comment"
import CommentItem from "./comment-item"

const CommentList = ({ data, remixId, queryKey }: { data: Comment[]; remixId: string; queryKey: string[] }) => {
  return (
    <div className="flex flex-col">
      {data.map((item, index) => (
        <CommentItem comments={data} key={item.id} data={item} remixId={remixId} queryKey={queryKey} />
      ))}
    </div>
  )
}

export default CommentList
