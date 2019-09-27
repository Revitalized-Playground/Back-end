import '@babel/polyfill/noConflict';
import { GraphQLServer, PubSub } from 'graphql-yoga';
import { resolvers } from './resolvers';
import { prisma } from './generated/prisma-client';
import passport from 'passport';
import './services/passport';

import { generateToken } from './utils/generateToken';

const pubsub = new PubSub();

export const server = new GraphQLServer({
	typeDefs: __dirname + '/schema.graphql',
	resolvers,
	context(request) {
		return {
			prisma,
			request,
			pubsub,
		};
	},
});

server.express.use(passport.initialize());

server.express.get(
	'/auth/facebook',
	passport.authenticate('facebook', { scope: ['email'], authType: 'rerequest', session: false }),
);

server.express.get(
	'/auth/facebook/callback',
	passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
	(req, res) => {
		console.log(req.user);
		const token = generateToken(req.user.userAccountId, req.user.id);
		return res.redirect(`${process.env.OAUTH_ROUTE}/oauth/${token}`);
	},
);

server.express.get(
	'/auth/google',
	passport.authenticate('google', {
		session: false,
		scope: ['profile', 'email'],
	}),
);

server.express.get(
	'/auth/google/callback',
	passport.authenticate('google', { session: false, failureRedirect: '/login' }),
	(req, res) => {
		console.log(req.user);
		const token = generateToken(req.user.userAccountId, req.user.id);
		return res.redirect(`${process.env.REACT_OAUTH_ROUTE}/oauth/${token}`);
	},
);

server.start({ port: process.env.PORT || 4000 }, () => {
	console.log(`GraphQL server is now running http://localhost:${process.env.PORT}`);
});
