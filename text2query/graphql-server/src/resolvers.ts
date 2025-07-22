import { User, Post, Comment } from './models';
import mongoose from 'mongoose';

export const resolvers = {
  Query: {
    users: async (_: any, { filter }: { filter?: any }) => {
      const query: any = {};
      if (filter) {
        if (filter.name) query.name = new RegExp(filter.name, 'i');
        if (filter.department) query.department = filter.department;
        if (filter.age) query.age = filter.age;
      }
      return await User.find(query);
    },

    user: async (_: any, { id }: { id: string }) => {
      return await User.findById(id);
    },

    posts: async (_: any, { filter, limit, offset }: { filter?: any; limit?: number; offset?: number }) => {
      const query: any = {};
      if (filter) {
        if (filter.title) query.title = new RegExp(filter.title, 'i');
        if (filter.authorId) query.authorId = new mongoose.Types.ObjectId(filter.authorId);
      }
      
      let postQuery = Post.find(query).sort({ createdAt: -1 });
      
      if (offset) postQuery = postQuery.skip(offset);
      if (limit) postQuery = postQuery.limit(limit);
      
      return await postQuery.exec();
    },

    post: async (_: any, { id }: { id: string }) => {
      return await Post.findById(id);
    },

    comments: async (_: any, { postId, authorId }: { postId?: string; authorId?: string }) => {
      const query: any = {};
      if (postId) query.postId = new mongoose.Types.ObjectId(postId);
      if (authorId) query.authorId = new mongoose.Types.ObjectId(authorId);
      return await Comment.find(query).sort({ createdAt: -1 });
    },

    comment: async (_: any, { id }: { id: string }) => {
      return await Comment.findById(id);
    }
  },

  User: {
    id: (user: any) => user._id.toString(),
    posts: async (user: any) => {
      return await Post.find({ authorId: user._id });
    }
  },

  Post: {
    id: (post: any) => post._id.toString(),
    author: async (post: any) => {
      return await User.findById(post.authorId);
    },
    comments: async (post: any) => {
      return await Comment.find({ postId: post._id }).sort({ createdAt: -1 });
    },
    createdAt: (post: any) => post.createdAt.toISOString()
  },

  Comment: {
    id: (comment: any) => comment._id.toString(),
    author: async (comment: any) => {
      return await User.findById(comment.authorId);
    },
    post: async (comment: any) => {
      return await Post.findById(comment.postId);
    },
    createdAt: (comment: any) => comment.createdAt.toISOString()
  }
};