import styles from './RecipeCard.module.css'; // 필요한 스타일 모듈 임포트
import heartImg from '/assets/icon_heart.svg'; // 하트 아이콘 임포트
import viewImg from '/assets/icon_views.svg';
import { RecipeCardProps } from '../../type/type';
import { useNavigate } from 'react-router-dom';
import { Tag } from 'antd';

const RecipeCard = ({ recipe }: RecipeCardProps) => {
	const navigate = useNavigate();

	const levelCircle = (difficulty: number) => {
		return (
			<div className={styles.outerCircle}>
				<div className={styles.innerCircle}>
					<span>Lv {difficulty}</span>
				</div>
			</div>
		);
	};

	// 클릭 시 경로 이동 함수
	const handleNavigate = () => {
		navigate(`/recipedetail/${recipe.id}`);
	};

	return (
		<div className={styles.recipeCard} onClick={handleNavigate}>
			<div className={styles.thumbnailContainer}>
				<img
					src={recipe.thumbnail_url}
					alt={recipe.recipe_name}
					className={styles.thumbnail}
				/>
				<div className={styles.levelBtnWrapper}>
					{levelCircle(recipe.recipe_difficulty)}
				</div>
			</div>

			<div className={styles.recipeInfo}>
				<div className={styles.recipeInfoHeader}>
					<h3 className={styles.recipeTitle}>{recipe.recipe_name}</h3>
					<div className={styles.viewsAndHearts}>
						<div className={styles.recipeViews}>
							<img src={viewImg} alt="views" className={styles.viewIcon} />
							<span className={styles.viewText}>{recipe.views}</span>
						</div>
						<span className={styles.seperator}></span>
						<div className={styles.recipeHearts}>
							<img src={heartImg} alt="heart" className={styles.heartIcon} />
							<span className={styles.heartText}>{recipe.hearts}</span>
						</div>
					</div>
				</div>
				<div className={styles.recipeDesc}>
					<span className={styles.recipeDescText}>
						{recipe.recipe_description}
					</span>
				</div>
				<div className={styles.recipeIngredients}>
					{recipe.recipe_ingredients.slice(0, 3).map((ingredient, index) => (
						<Tag key={index} className={styles.ingredient}>
							<span className={styles.ingredientText}>{ingredient.name}</span>
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
		</div>
	);
};

export default RecipeCard;
