import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    age: Int!
    department: String!
    posts: [Post!]!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    comments: [Comment!]!
    createdAt: String!
  }

  type Comment {
    id: ID!
    content: String!
    author: User!
    post: Post!
    createdAt: String!
  }

  input UserFilter {
    name: String
    department: String
    age: Int
  }

  input PostFilter {
    title: String
    authorId: ID
  }

  type Query {
    users(filter: UserFilter): [User!]!
    user(id: ID!): User
    posts(filter: PostFilter, limit: Int, offset: Int): [Post!]!
    post(id: ID!): Post
    comments(postId: ID, authorId: ID): [Comment!]!
    comment(id: ID!): Comment
  }
`;