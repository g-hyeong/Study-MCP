import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  age: number;
  department: string;
}

export interface IPost extends Document {
  title: string;
  content: string;
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IComment extends Document {
  content: string;
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, required: true },
  department: { type: String, required: true }
});

const PostSchema = new Schema<IPost>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, required: true }
});

const CommentSchema = new Schema<IComment>({
  content: { type: String, required: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, required: true }
});

export const User = mongoose.model<IUser>('User', UserSchema);
export const Post = mongoose.model<IPost>('Post', PostSchema);
export const Comment = mongoose.model<IComment>('Comment', CommentSchema);