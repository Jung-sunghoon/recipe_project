import { useEffect, useState } from 'react';
import styles from './AddAndEdit.module.css'; // module.css 파일 import
import CustomButton, {
	ButtonType,
} from '../../components/custombutton/CustomButton';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import pictureIcon from '/assets/icon_picture.svg';
import backIcon from '/assets/icon_back.svg';
import useThumbnailImgUpload from '../../hooks/useThumbnailImgUpload';
import useStepImgUpload from '../../hooks/useStepImgUpload';
import useAddRecipe from '../../hooks/useAddRecipe';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AddAndEdit = () => {
	const [recipeName, setRecipeName] = useState('');
	const [cookingTimeHour, setCookingTimeHour] = useState<string>('');
	const [cookingTimeMinute, setCookingTimeMinute] = useState<string>('');
	const [ingredients, setIngredients] = useState([{ name: '', amount: '' }]);
	const [difficulty, setDifficulty] = useState<string>('');
	const navigate = useNavigate();
	const { nickname, user } = useAuth();
	const [recipeTip, setRecipeTip] = useState('');
	const [recipeDesc, setRecipeDesc] = useState('');
	const [tags, setTags] = useState<string[]>([]);
	const [views, setViews] = useState<number>(0);
	const [hearts, setHearts] = useState<number>(0);
	const { imageUrl, uploadImage, setImageUrl } = useThumbnailImgUpload();

	const handleThumbnailImgChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (file) {
			uploadImage(file); // 이미지 업로드 함수 호출
		}
	};

	const [steps, setSteps] = useState([{ description: '', image: '' }]);
	const { uploadStepImage, uploadProgress } = useStepImgUpload(); // Step 이미지 업로드 훅 사용

	// 레시피 단계 이미지 함수
	const handleStepImgChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
		index: number
	) => {
		const file = event.target.files?.[0];
		if (file) {
			try {
				// 이미지 업로드 완료 후 URL을 받아옴
				const downloadURL = await uploadStepImage(file, index);

				// 해당 단계의 이미지 상태를 업데이트
				setSteps((prevSteps) =>
					prevSteps.map((step, i) =>
						i === index ? { ...step, image: downloadURL } : step
					)
				);
			} catch (error) {
				console.error('Image upload failed:', error);
			}
		}
	};

	// 재료 input 추가 함수
	const addIngredient = () => {
		setIngredients([...ingredients, { name: '', amount: '' }]);
	};

	// 재료 input 삭제 함수
	const removeIngredient = (index: number) => {
		setIngredients(ingredients.filter((_, i) => i !== index));
	};

	// 단계 input 추가 함수
	const addStep = () => {
		setSteps([...steps, { description: '', image: '' }]);
	};

	// 단계 input 제거 함수
	const removeStep = (index: number) => {
		setSteps(steps.filter((_, i) => i !== index));
	};

	// 레시피 Add 함수
	const { addRecipe, getRecipe, updateRecipe } = useAddRecipe(); // custom hook 사용

	const [isSubmitDisabled, setIsSubmitDisabled] = useState<boolean>(true);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault(); // 기본 제출 방지

		if (
			user &&
			recipeName &&
			recipeDesc &&
			cookingTimeHour &&
			cookingTimeMinute &&
			ingredients &&
			difficulty !== '레벨을 선택해주세요' &&
			steps &&
			recipeTip &&
			imageUrl &&
			tags
		) {
			const recipeData = {
				author: {
					user_nickname: nickname ? nickname : user?.displayName, // 예시 이메일
					user_uid: user.uid,
				}, // 적절한 author 데이터 설정
				hearts: hearts, // 예시값
				recipe_difficulty: parseInt(difficulty.replace(/\D/g, ''), 10),
				recipe_ingredients: ingredients.map((ing) => ({
					name: ing.name,
					volume: ing.amount,
				})),
				recipe_name: recipeName,
				recipe_description: recipeDesc,
				recipe_steps: steps.map((step) => ({
					step_description: step.description,
					step_image_url: step.image,
				})),
				recipe_tags: tags,
				recipe_time: {
					hours: parseInt(cookingTimeHour, 10),
					minutes: parseInt(cookingTimeMinute, 10),
				},
				recipe_tips: recipeTip,
				thumbnail_url: imageUrl, // 업로드된 이미지 URL
				views: views,
			};

			setIsSubmitDisabled(false);
			if (id) {
				await updateRecipe(id, recipeData);
			} else {
				await addRecipe(recipeData);
			}
			navigate('/recipelist');
		} else if (isSubmitDisabled) {
			setIsSubmitDisabled(true);
			alert('모든 필드를 입력해주세요.');
			return;
		}
	};

	const handleCookingTimeHourChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const value = Number(e.target.value);
		// 최대값 및 최소값 검사
		if (value >= 0) {
			setCookingTimeHour(e.target.value);
		}
	};

	const handleCookingTimeMinuteChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const value = Number(e.target.value);
		// 최대값 및 최소값 검사
		if (value >= 0 && value <= 59) {
			setCookingTimeMinute(e.target.value);
		}
	};

	// 난이도 드롭다운 항목
	const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 드롭다운 상태
	const [selectedDifficulty, setSelectedDifficulty] = useState<number | string>(
		'레벨을 선택해주세요'
	);

	const difficultyOptions = [
		{ value: 1, label: 'Lv 1' },
		{ value: 2, label: 'Lv 2' },
		{ value: 3, label: 'Lv 3' },
	];

	const toggleDropdown = () => {
		setIsDropdownOpen(!isDropdownOpen);
	};

	const handleDifficultySelect = (value: string) => {
		setSelectedDifficulty(value); // 선택된 난이도 설정
		setDifficulty(value); // 상태 업데이트
		setIsDropdownOpen(false); // 드롭다운 닫기
	};

	// 생성 및 수정
	const { id } = useParams();

	useEffect(() => {
		const fetchRecipe = async () => {
			if (id) {
				const recipeData = await getRecipe(id);
				if (recipeData) {
					setRecipeName(recipeData.recipe_name);
					setRecipeDesc(recipeData.recipe_description);
					setCookingTimeHour(recipeData.recipe_time.hours.toString());
					setCookingTimeMinute(recipeData.recipe_time.minutes.toString());
					setIngredients(
						recipeData.recipe_ingredients.map((ing) => ({
							name: ing.name,
							amount: ing.volume,
						}))
					);
					setDifficulty(`Lv ${recipeData.recipe_difficulty}`);
					setSelectedDifficulty(`Lv ${recipeData.recipe_difficulty}`);
					setSteps(
						recipeData.recipe_steps.map((step) => ({
							description: step.step_description,
							image: step.step_image_url,
						}))
					);
					setRecipeTip(recipeData.recipe_tips);
					setTags(recipeData.recipe_tags);
					// Assuming you have a way to set the thumbnail image URL
					setImageUrl(recipeData.thumbnail_url);
					setViews(recipeData.views);
					setHearts(recipeData.hearts);
				}
			}
		};

		fetchRecipe();
		window.scrollTo(0, 0);
	}, [id]);

	return (
		<div className={styles.createAndEditSection}>
			{/* 헤더 부분 */}
			<div className={styles.createAndEditHeader}>
				<button
					className={styles.backStepIcon}
					onClick={() => window.history.back()}
				>
					<img src={backIcon} />
				</button>
				<div className={styles.createAndEditDesc}>
					<p>Special Cooking Recipe</p>
					<p>
						<span>{nickname ? nickname : user?.displayName} 's</span> 레시피
					</p>
				</div>
			</div>
			<form className={styles.recipeForm}>
				{/* 레시피 이름 */}
				<div className={styles.formGroup}>
					<label className={styles.formLabel}>요리 이름 | Recipe Name</label>
					<input
						className={styles.formInput}
						type="text"
						value={recipeName}
						onChange={(e) => setRecipeName(e.target.value)}
						maxLength={30}
						placeholder="요리 이름을 입력하세요"
					/>
					<span className={styles.charCounter}>{recipeName.length}/30 자</span>
				</div>

				{/* 레시피 설명 */}
				<div className={`${styles.formGroup} ${styles.recipeDesc}`}>
					<label className={styles.formLabel}>
						요리 설명 | Recipe Description
					</label>
					<textarea
						className={styles.formTextArea}
						value={recipeDesc}
						onChange={(e) => setRecipeDesc(e.target.value)}
						maxLength={50}
						placeholder="요리에 대한 스토리 또는 간단 설명을 작성해주세요."
					/>
					<span className={styles.charCounter}>{recipeDesc.length}/50 자</span>
				</div>

				{/* 사진 등록 */}
				<div className={styles.formGroup}>
					<label className={styles.formLabel}>사진 등록 | Picture</label>
					<div
						className={styles.imageUploadPlaceholder}
						onClick={() => document.getElementById('fileUpload')?.click()}
					>
						{/* // 클릭 시 파일 선택 */}
						{imageUrl ? (
							<img
								src={imageUrl}
								alt="Uploaded preview"
								className={styles.uploadedImage} // 필요에 따라 스타일 적용
							/>
						) : (
							<img
								src={pictureIcon}
								alt="Upload icon"
								className={styles.uploadIcon}
							/>
						)}
						<input
							type="file"
							accept="image/*"
							onChange={handleThumbnailImgChange}
							className={styles.imageInput}
							id="fileUpload"
							style={{ display: 'none' }} // 기본 input 숨기기
						/>
					</div>
				</div>

				{/* 조리 시간 */}
				<div className={styles.formGroup}>
					<label className={styles.formLabel}>조리 시간 | Cooking Time</label>
					<div className={styles.cookingTimeInputs}>
						<input
							className={styles.formInput}
							type="text"
							min={0}
							value={cookingTimeHour}
							onChange={handleCookingTimeHourChange}
						/>
						<label>시간</label>
						<input
							className={styles.formInput}
							type="text"
							max={59}
							min={0}
							value={cookingTimeMinute}
							onChange={handleCookingTimeMinuteChange}
						/>
						<label>분</label>
					</div>
				</div>

				{/* 요리 재료 */}
				<div className={styles.formGroup}>
					<label className={styles.formLabel}>
						요리 재료 | Food Ingredients
					</label>
					{ingredients.map((ingredient, index) => (
						<div key={index} className={styles.ingredientInputs}>
							<input
								className={`${styles.formInput} ${styles.ingredientNameInput}`}
								type="text"
								value={ingredient.name}
								onChange={(e) =>
									setIngredients(
										ingredients.map((ing, i) =>
											i === index ? { ...ing, name: e.target.value } : ing
										)
									)
								}
								placeholder="재료명"
							/>
							<input
								className={`${styles.formInput} ${styles.ingredientAmountInput}`}
								type="text"
								value={ingredient.amount}
								onChange={(e) =>
									setIngredients(
										ingredients.map((ing, i) =>
											i === index ? { ...ing, amount: e.target.value } : ing
										)
									)
								}
								placeholder="양(단위)"
							/>
							{/* 재료 삭제 버튼 */}
							<div className={styles.deleteBtnContainer}>
								<button
									className={styles.deleteBtn}
									type="button"
									onClick={() => removeIngredient(index)}
								>
									<MinusOutlined /> 삭제하기
								</button>
							</div>
						</div>
					))}
					<CustomButton
						onClick={addIngredient}
						btnType={ButtonType.Plus}
						size="medium"
						color="orange"
						shape="circle"
					>
						<PlusOutlined />
					</CustomButton>
				</div>

				{/* 난이도 */}
				<div className={styles.formGroup}>
					<label className={styles.formLabel}>난이도 | Difficulty Level</label>
					<div className={styles.dropdown} onClick={toggleDropdown}>
						<div className={styles.dropdownSelected}>{selectedDifficulty}</div>
						{isDropdownOpen && (
							<div className={styles.dropdownOptions}>
								{difficultyOptions.map((option) => (
									<div
										key={option.value}
										className={styles.dropdownOption}
										onClick={() => handleDifficultySelect(option.label)}
									>
										{option.label}
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* 레시피 단계 */}
				<div className={styles.formGroup}>
					<label className={styles.formLabel}>레시피 | Recipe</label>
					{steps.map((step, index) => (
						<div key={index} className={styles.recipeSteps}>
							<CustomButton
								btnType={ButtonType.Step}
								size="medium"
								color="orange"
								shape="circle"
							>
								<span className={styles.recipeStepNumber}>
									{(index + 1).toString().padStart(2, '0')}
								</span>
							</CustomButton>
							<div className={styles.recipeStep}>
								<textarea
									className={styles.formTextArea}
									value={step.description}
									onChange={(e) =>
										setSteps(
											steps.map((st, i) =>
												i === index
													? { ...st, description: e.target.value }
													: st
											)
										)
									}
									placeholder="레시피의 자세한 내용을 적어주세요"
								/>
								{/* 사진 등록 버튼 */}
								<div
									className={styles.imageUploadPlaceholder}
									onClick={() =>
										document.getElementById(`stepFileUpload-${index}`)?.click()
									}
								>
									{step.image ? (
										<img
											src={step.image}
											alt={`Step ${index}`}
											className={styles.uploadedImage}
										/>
									) : (
										<img
											src={pictureIcon}
											alt="Upload icon"
											className={styles.uploadIcon}
										/>
									)}
									{/* 업로드 진행률 표시 - 각 단계에 맞는 진행률 표시 */}
									{uploadProgress[index] > 0 && uploadProgress[index] < 100 && (
										<div className={styles.uploadProgress}>
											<div
												className={styles.progressBar}
												style={{ width: `${uploadProgress[index]}%` }}
											/>
										</div>
									)}
									<input
										type="file"
										accept="image/*"
										onChange={(e) => handleStepImgChange(e, index)}
										className={styles.imageInput}
										id={`stepFileUpload-${index}`}
										style={{ display: 'none' }}
									/>
								</div>
								{/* 재료 삭제 버튼 */}
								<div className={styles.deleteRecipeBtnContainer}>
									<button
										className={styles.deleteBtn}
										type="button"
										onClick={() => removeStep(index)}
									>
										<MinusOutlined /> 삭제하기
									</button>
								</div>
							</div>
						</div>
					))}
					<CustomButton
						onClick={addStep}
						btnType={ButtonType.Plus}
						size="medium"
						color="orange"
						shape="circle"
					>
						<PlusOutlined />
					</CustomButton>
				</div>

				{/* 레시피 팁 */}
				<div className={`${styles.formGroup} ${styles.recipeTips}`}>
					<label className={styles.formLabel}>레시피 팁 | Recipe Tip</label>
					<textarea
						className={styles.formTextArea}
						value={recipeTip}
						onChange={(e) => setRecipeTip(e.target.value)}
						placeholder="추가 설명을 입력하세요."
					/>
				</div>

				{/* 태그 */}
				<div className={`${styles.formGroup} ${styles.recipeTags}`}>
					<label className={styles.formLabel}>태그 등록 | Tag</label>
					<textarea
						className={styles.formTextArea}
						value={tags.join(',')}
						onChange={(e) => {
							setTags(e.target.value.split(','));
						}}
						placeholder="태그는 반드시 ,로 구분해주세요 | 예) 돼지고기, 다이어트, 비만, 칼슘, 제철음식, 이유식, 초간단"
					/>
				</div>

				{/* 버튼 */}
				<div className={styles.formActions}>
					<CustomButton
						onClick={() => window.history.back()}
						btnType={ButtonType.Back}
						color="gray"
						shape="rad20"
					>
						뒤로가기
					</CustomButton>
					<CustomButton
						onClick={handleSubmit}
						btnType={ButtonType.Back}
						color="orange"
						shape="rad20"
					>
						등록하기
					</CustomButton>
				</div>
			</form>
		</div>
	);
};

export default AddAndEdit;
