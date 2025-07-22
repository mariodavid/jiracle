import type {FavoriteIssue} from '../types/jira-types.js';

export function getFavoriteKeys(favorites: FavoriteIssue[]): string[] {
	return favorites.map(fav => fav.key);
}

export function getFavoriteDefaultComment(
	favorites: FavoriteIssue[],
	issueKey: string,
): string | undefined {
	const favorite = favorites.find(fav => fav.key === issueKey);
	return favorite?.defaultComment;
}

export function getFavoriteDefaultTime(
	favorites: FavoriteIssue[],
	issueKey: string,
): string | undefined {
	const favorite = favorites.find(fav => fav.key === issueKey);
	return favorite?.defaultTime;
}
