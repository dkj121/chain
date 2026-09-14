namespace TestRazorApp.Models;

public class ProductListViewModel
{
    public string PageTitle { get; set; } = string.Empty;
    public List<Product> Products { get; set; } = new();
    public string SelectedCategory { get; set; } = string.Empty;
    public List<string> Categories { get; set; } = new();
    public int TotalProducts { get; set; }
}
