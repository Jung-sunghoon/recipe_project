import { useCallback } from 'react';
import { db } from '../firebase/config';
import {
	collection,
	addDoc,
	doc,
	getDoc,
	updateDoc,
	Timestamp,
} from 'firebase/firestore';
import { Recipe } from '../type/type';

const useAddRecipe = () => {
	const addRecipe = useCallback(async (recipeData: any) => {
		try {
			const docRef = await addDoc(collection(db, 'recipes'), {
				...recipeData,
				views: recipeData.views || 0, // 기본값으로 0 설정
				hearts: recipeData.hearts || 0, // 기본값으로 0 설정
				recipe_create_time: Timestamp.now(),
			});
			return docRef.id;
		} catch (error) {
			console.error('Error adding document: ', error);
			throw error;
		}
	}, []);

	const updateRecipe = useCallback(async (id: string, recipeData: any) => {
		try {
			const recipeRef = doc(db, 'recipes', id);
			await updateDoc(recipeRef, {
				...recipeData,
				recipe_update_time: Timestamp.now(),
				views: recipeData.views, // 기존 views 값 유지
				hearts: recipeData.hearts, // 기존 hearts 값 유지
			});
		} catch (error) {
			console.error('Error updating document: ', error);
			throw error;
		}
	}, []);

	const getRecipe = useCallback(async (id: string): Promise<Recipe | null> => {
		try {
			const recipeRef = doc(db, 'recipes', id);
			const recipeSnap = await getDoc(recipeRef);

			if (recipeSnap.exists()) {
				return { id: recipeSnap.id, ...recipeSnap.data() } as Recipe;
			} else {
				return null;
			}
		} catch (error) {
			console.error('Error getting document: ', error);
			throw error;
		}
	}, []);

	return { addRecipe, updateRecipe, getRecipe };
};

export default useAddRecipe;
