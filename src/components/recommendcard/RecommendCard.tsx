import styles from './RecommendCard.module.css';
import heartImg from '/assets/icon_heart.svg';

import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useEffect, useState } from 'react';
import { Tag } from 'antd'; // antd의 Tag 컴포넌트 임포트
import { useNavigate } from 'react-router-dom';

const RecommendCard = () => {
	const [topRecipes, setTopRecipes] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const getTopHeartsRecipes = async () => {
		try {
			const recipesRef = collection(db, 'recipes');
			const q = query(recipesRef, orderBy('hearts', 'desc'), limit(2));
			const querySnapshot = await getDocs(q);

			const topRecipes = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));

			return topRecipes;
		} catch (error) {
			console.error('Error fetching recipes: ', error);
			return [];
		}
	};

	useEffect(() => {
		const fetchTopRecipes = async () => {
			setLoading(true); // 데이터를 불러오기 시작할 때 로딩 상태를 true로 설정
			try {
				const recipes = await getTopHeartsRecipes();
				setTopRecipes(recipes);
			} catch (error) {
				console.error('Error fetching recipes:', error);
			} finally {
				setLoading(false); // 데이터를 다 불러온 후 로딩 상태를 false로 설정
				window.scrollTo(0, 0);
			}
		};

		fetchTopRecipes();
	}, []);

	const levelCircle = (recipe_difficulty: number) => {
		return (
			<div className={styles.outerCircle}>
				<div className={styles.innerCircle}>
					<span>Lv {recipe_difficulty}</span>
				</div>
			</div>
		);
	};

	const handleClickEvent = (id: string) => {
		navigate(`/recipedetail/${id}`);
	};

	return (
		<>
			{loading && <div className={styles.loading}>로딩 중...</div>}
			<div className={styles.recommendCardSection}>
				{topRecipes.map((recipe) => (
					<article key={recipe.id} className={styles.recommendCardArticle}>
						<div className={styles.recommendCardTitle}>
							<span className={styles.userNickname}>
								{recipe.author.user_nickname}'s
							</span>
							<span>추천 레시피</span>
						</div>
						<div className={styles.recommendRecipe}>
							<div className={styles.recommendCardImgSection}>
								<img
									className={styles.recommendCardImg}
									src={recipe.thumbnail_url}
								/>
								{levelCircle(recipe.recipe_difficulty)}
							</div>
							<div className={styles.recipeDescription}>
								<div className={styles.heartImgAndText}>
									<img className={styles.heartImg} src={heartImg} alt="heart" />
									<span className={styles.heartText}>{recipe.hearts}</span>
								</div>
								<div className={styles.recipeNameAndIng}>
									<div className={styles.recipeName}>{recipe.recipe_name}</div>
									<div className={styles.recipeTags}>
										{/* antd의 Tag 컴포넌트를 사용하여 태그들을 분할하여 표시 */}
										{recipe.recipe_ingredients
											.slice(0, 3)
											.map((ingredient: any, index: number) => (
												<Tag key={index} className={styles.ingredient}>
													<span className={styles.ingredientText}>
														{ingredient.name}
													</span>
												</Tag>
											))}

										{recipe.recipe_ingredients.length > 4 && (
											<Tag className={styles.ingredient}>
												<span className={styles.ingredientText}>
													+{recipe.recipe_ingredients.length - 3}
												</span>
											</Tag>
										)}
									</div>
								</div>
								<div className={styles.recipeDetailLinkWrapper}>
									<button
										className={styles.recipeDetailLinkBtn}
										onClick={() => handleClickEvent(recipe.id)}
									>
										레시피 보러가기
									</button>
								</div>
							</div>
						</div>
					</article>
				))}
			</div>
		</>
	);
};

export default RecommendCard;
